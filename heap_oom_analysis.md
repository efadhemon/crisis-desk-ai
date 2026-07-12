# 🔴 Production Heap OOM — Root-Cause Analysis

## TL;DR

Your Node.js process is crashing at **~1 GB heap** after running for **~26 minutes** (`1562057 ms`). The crash is caused by **multiple compounding memory pressures**, not a single leak. Here are the findings ranked by severity.

---

## Log Breakdown

```
Scavenge (interleaved) 979.9 (1000.7) -> 978.2 (1004.7) MB
Mark-Compact (reduce) 982.0 (1004.7) -> 981.4 (1001.2) MB
```

- The heap is **stuck at ~980 MB** and GC cannot reclaim anything meaningful (`mu = 0.279`).
- Node.js defaults to a **~1 GB max heap** (on 64-bit with Node 22), and there is **no `--max-old-space-size`** set on the main process (`entrypoint.sh` runs `node dist/main.js` without flags).

```
DeprecationWarning: Calling client.query() when the client is already executing a query
```

- This is from the [NotificationDbListenerService](file:///home/efadh/WorkSpace/wagehat/wagehat-core-api/src/app/modules/notification/subscribers/notification-db-listener.service.ts) firing multiple `LISTEN` queries on the same raw `pg.Client` without awaiting sequentially during startup.

---

## Issue #1 — 🔴 CRITICAL: OpenTelemetry Auto-Instrumentation

**File:** [tracing.ts](file:///home/efadh/WorkSpace/wagehat/wagehat-core-api/src/tracing.ts)

```typescript
getNodeAutoInstrumentations({
  '@opentelemetry/instrumentation-fs': { enabled: false },
}),
```

### Problem

`getNodeAutoInstrumentations()` enables **~30+ instrumentations** by default, including:

| Instrumentation                               | Memory Impact                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `@opentelemetry/instrumentation-http`         | Wraps every HTTP request/response with spans + baggage — **high**                  |
| `@opentelemetry/instrumentation-pg`           | Wraps every PostgreSQL query (you have 20-pool + LISTEN client) — **high**         |
| `@opentelemetry/instrumentation-express`      | Already duplicated by NestInstrumentation — **redundant**                          |
| `@opentelemetry/instrumentation-redis`        | Wraps every Valkey/Redis command (cache + queue + presence = 3 clients) — **high** |
| `@opentelemetry/instrumentation-dns`          | Wraps DNS lookups — **unnecessary noise**                                          |
| `@opentelemetry/instrumentation-net`          | Wraps raw TCP sockets — **unnecessary**                                            |
| `@opentelemetry/instrumentation-generic-pool` | Wraps connection pool operations — **medium**                                      |

Each span is an object tree kept in memory until the `BatchSpanProcessor` flushes (default batch of 512 spans, 5s interval). Under load, this can hold **tens of thousands of spans** in memory simultaneously, easily consuming **200-400 MB**.

### Fix

Only enable the instrumentations you actually need:

```typescript
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';

sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
  instrumentations: [
    new HttpInstrumentation(),
    new NestInstrumentation(),
    // Only add PgInstrumentation if you actually need DB query traces
  ],
});
```

> [!IMPORTANT]
> This single change will likely reduce baseline memory by **150-300 MB**.

---

## Issue #2 — 🔴 CRITICAL: Puppeteer (Chromium) In-Process

**File:** [pdfGenerator.helper.ts](file:///home/efadh/WorkSpace/wagehat/wagehat-core-api/src/app/helpers/pdfGenerator.helper.ts)

### Problem

Puppeteer launches a **full Chromium browser** in a child process that shares the same container memory. Key issues:

1. **Chromium itself** uses **300-500 MB** of memory per browser instance (even idle).
2. The flag `--max-old-space-size=4096` on line 320 sets Chromium's V8 heap to **4 GB** — this is the _browser's_ V8, not Node's, but it allows Chromium to grow unbounded.
3. The `--memory-pressure-off` flag on line 319 **disables Chromium's own memory pressure signals**, preventing it from releasing unused memory.
4. The idle timeout is **5 minutes** (`idleTime = 300000`), meaning after each PDF batch the browser sits consuming ~300 MB+ for 5 minutes.
5. Each `page.setContent()` with `waitUntil: 'networkidle0'` loads the HTML content into a full rendering engine.
6. The retry logic (`maxRetries = 10`) with `unshift` (line 209) means failed PDFs can loop and accumulate pages.

### Fix

```typescript
// 1. Remove dangerous flags
args: [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-extensions',
  '--no-first-run',
  // REMOVE: '--memory-pressure-off'
  // REMOVE: '--max-old-space-size=4096'
  // ADD: memory-constrained flags
  '--js-flags=--max-old-space-size=256',  // Limit Chromium's V8 to 256MB
  '--single-process',                      // Fewer child processes
  '--disable-background-networking',
],

// 2. Reduce idle timeout to 60 seconds
private readonly idleTime = 60000;

// 3. Reduce max retries
private readonly maxRetries = 3;

// 4. Use 'domcontentloaded' instead of 'networkidle0'
await page.setContent(htmlContent, {
  waitUntil: 'domcontentloaded',  // Much faster, less memory
  timeout: this.pageTimeout - 5000,
});
```

> [!WARNING]
> Ideally, PDF generation should be moved to a **separate microservice or worker process** to isolate its memory footprint from the API server. This is the most impactful architectural change you can make.

---

## Issue #3 — 🟠 HIGH: No `--max-old-space-size` on Node Process

**File:** [entrypoint.sh](file:///home/efadh/WorkSpace/wagehat/wagehat-core-api/entrypoint.sh)

```bash
# Current: No memory flag
node dist/main.js

# Fixed: Set explicit heap limit
node --max-old-space-size=1024 dist/main.js
```

### Problem

Node.js 22 defaults to ~1 GB heap on a 2 GB container, but without an explicit flag, the exact limit depends on available system memory. If your container has 2-4 GB, Node may try to use more but get killed by the OOM killer before it reaches the actual limit.

### Fix — `entrypoint.sh`

```bash
#!/bin/bash

# Run migrations
node ./node_modules/typeorm/cli.js migration:run -d ./dist/database/data-source.js

# Run seeds
node dist/database/seeds/seed.js

# Start the application with explicit heap limit
node --max-old-space-size=1536 dist/main.js
```

> [!TIP]
> Also consider adding `--expose-gc` during debugging to enable manual GC triggers for diagnostics.

---

## Issue #4 — 🟡 MEDIUM: pg Client LISTEN Query Overlap

**File:** [notification-db-listener.service.ts](file:///home/efadh/WorkSpace/wagehat/wagehat-core-api/src/app/modules/notification/subscribers/notification-db-listener.service.ts#L61-L64)

```typescript
await this.client.query(`LISTEN buffer_notification_inserted`);
await this.client.query(`LISTEN email_notification_inserted`);
await this.client.query(`LISTEN sms_notification_inserted`);
await this.client.query(`LISTEN user_notification_inserted`);
```

### Problem

The deprecation warning `Calling client.query() when the client is already executing a query` appears in your logs. While these calls are `await`ed sequentially, the warning suggests one of these scenarios:

1. The notification listener callback (line 37-58) is **calling `client.query`** indirectly via the queue services while a previous callback's query is still in-flight on the same client.
2. During reconnection scenarios, multiple `LISTEN` calls may overlap.

This doesn't directly cause the OOM but indicates **connection contention** that can lead to query queuing and memory buildup.

### Fix

The `notification` handler is `async` but attaches to the client's `notification` event. If notifications arrive rapidly, multiple handlers execute concurrently on the same client. While the handler itself doesn't query the client (it delegates to BullMQ queues), ensure no internal code path in the queue service triggers a query on this same client:

```typescript
// Add error handling and prevent concurrent handler execution
private isProcessing = false;
private pendingNotifications: pg.Notification[] = [];

this.client.on('notification', (msg) => {
  this.pendingNotifications.push(msg);
  this.processNotifications();
});

private async processNotifications() {
  if (this.isProcessing) return;
  this.isProcessing = true;

  try {
    while (this.pendingNotifications.length > 0) {
      const msg = this.pendingNotifications.shift();
      // ... process notification
    }
  } finally {
    this.isProcessing = false;
  }
}
```

---

## Issue #5 — 🟡 MEDIUM: Notification Campaign Loads All Users Into Memory

**File:** [notificationCampaign.service.ts](file:///home/efadh/WorkSpace/wagehat/wagehat-core-api/src/app/modules/notification/services/notificationCampaign.service.ts#L207-L303)

```typescript
case ENUM_CAMPAIGN_TARGET_AUDIENCE.ALL_USERS:
  const allUsers = await this.userService.repo.find({
    where: { isActive: true },
    select: { id: true },
  });
  userIds = allUsers.map((u) => u.id);
  break;
```

### Problem

`getTargetUsers()` loads **all active users** into memory as full entity objects (even though `select: { id: true }` is used, TypeORM still creates entity instances). For a production app with tens of thousands of users, this creates a large in-memory array.

Additionally, `processCampaign()` on line 482-628 runs in a **background `Promise`** (fire-and-forget pattern on line 380). If two campaigns are started simultaneously, they both run concurrently without any concurrency control.

### Fix

Use raw SQL or `pluck` to get just IDs as strings:

```typescript
case ENUM_CAMPAIGN_TARGET_AUDIENCE.ALL_USERS:
  const allUsers = await this.userService.repo
    .createQueryBuilder('user')
    .where('user.isActive = :isActive', { isActive: true })
    .select('user.id', 'id')
    .getRawMany();
  userIds = allUsers.map((u) => u.id);
  break;
```

---

## Issue #6 — 🟢 LOW: Nodemailer Transporter Re-creation

**File:** [emailNotification.service.ts](file:///home/efadh/WorkSpace/wagehat/wagehat-core-api/src/app/modules/notification/services/emailNotification.service.ts#L84-L92)

```typescript
// Created on EVERY email send
const transporter = nodemailer.createTransport({ ... });
```

### Problem

A new SMTP transport (TCP connection + TLS handshake) is created for **every single email**. During a notification campaign, this means thousands of transporter objects are created and garbage collected, adding memory pressure.

### Fix

Cache the transporter:

```typescript
private transporter: nodemailer.Transporter | null = null;

private async getTransporter(): Promise<nodemailer.Transporter> {
  if (this.transporter) return this.transporter;

  const gateway = await this.emailGatewayService.findOne({
    where: {
      accountType: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT,
      isActive: true,
    },
  });

  this.transporter = nodemailer.createTransport({
    host: gateway.host,
    port: toNumber(gateway.port),
    secure: toBool(gateway.isSecure),
    auth: { user: gateway.authUser, pass: gateway.authPassword },
    pool: true,          // Connection pooling
    maxConnections: 5,   // Limit concurrent connections
  });

  return this.transporter;
}
```

---

## Summary — Memory Budget Estimate

| Component                                  | Estimated Memory |
| ------------------------------------------ | ---------------- |
| Node.js + NestJS framework baseline        | ~150 MB          |
| OpenTelemetry auto-instrumentations (30+)  | ~200-400 MB      |
| Puppeteer Chromium (when active)           | ~300-500 MB      |
| TypeORM entity metadata + connection pool  | ~50 MB           |
| BullMQ workers (4 queues)                  | ~30 MB           |
| Valkey clients (3: cache, presence, queue) | ~15 MB           |
| Winston logger + file transports           | ~20 MB           |
| **Total under load**                       | **~765-1165 MB** |

> [!CAUTION]
> With everything running concurrently, your process easily hits the **1 GB default heap limit**. The combination of OpenTelemetry + Puppeteer alone can consume **500-900 MB**, leaving almost nothing for actual API request processing.

---

## Recommended Action Plan

| Priority | Action                                                                             | Impact                     | Effort    |
| -------- | ---------------------------------------------------------------------------------- | -------------------------- | --------- |
| 🔴 P0    | Replace `getNodeAutoInstrumentations` with selective instrumentations              | Saves ~200-300 MB          | 15 min    |
| 🔴 P0    | Add `--max-old-space-size=1536` to `entrypoint.sh`                                 | Prevents premature OOM     | 2 min     |
| 🔴 P0    | Remove `--memory-pressure-off` and `--max-old-space-size=4096` from Puppeteer args | Constrains Chromium memory | 5 min     |
| 🟠 P1    | Reduce Puppeteer idle timeout from 5 min to 1 min                                  | Faster memory release      | 2 min     |
| 🟠 P1    | Add `deploy.resources.limits.memory` to docker-compose                             | Prevents container kill    | 5 min     |
| 🟡 P2    | Cache nodemailer transporter                                                       | Reduces GC pressure        | 15 min    |
| 🟡 P2    | Use raw queries in campaign audience resolution                                    | Reduces peak allocation    | 10 min    |
| 🔵 P3    | Move PDF generation to separate worker service                                     | Architectural isolation    | 2-4 hours |

---

> [!NOTE]
> Want me to implement any of these fixes? I recommend starting with **P0 items** — they're quick wins that will likely resolve the OOM immediately.
