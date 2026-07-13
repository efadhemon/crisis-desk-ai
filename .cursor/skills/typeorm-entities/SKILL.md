---
name: typeorm-entities
description: Defines how to author TypeORM entities in this project using AutoEntity, AutoIndex, and AutoJoinColumn. Use when adding or editing entities or database decorators; do not author migration files unless the user explicitly asks (developers generate those via package.json scripts).
---

# TypeORM entities (current standard)

## Do this (new pattern)

1. Decorate the class with **`@AutoEntity(options?)`** from `@src/database/decorators`. Do **not** use `@Entity(ENUM_TABLE_NAMES.…)`.
2. Define **`public static readonly tableName`** — PostgreSQL table name in **snake_case** (e.g. `'worker_profiles'`, `'career_counselors'`).
3. Define **`public static readonly apiRouteName`** — REST segment in **kebab-case** when the entity maps to HTTP routes (e.g. `'worker-profiles'`, `'career-counselors'`). **Use this in controllers** so the path stays in sync with the entity (see Controllers below).
4. Define **`public static readonly SEARCH_TERMS`** — fields (including relation dot paths like `'user.fullName'`) used by **`findAllBase`** when **`searchTerm`** is present.
5. Document **`tableName`**, **`apiRouteName`**, and **`SEARCH_TERMS`** with the same JSDoc pattern as **`WorkerProfile`** (short block above each static).
6. Import **`ENUM_COLUMN_TYPES`** from `@src/shared` for `@Column` types. Prefer **not** adding new entries to **`ENUM_TABLE_NAMES`** for entities that follow this pattern (table name lives on the class).
7. Use **`@AutoIndex()`** / **`@AutoIndex({ unique: true })`** on columns that are filtered or must be unique (generates `idx_<table>_<column>` names).
8. For **`ManyToOne`** relations:
   - Add **`@AutoJoinColumn()`** on the relation property (FK column defaults to `<relationName>Id`, e.g. `user` → `userId`).
   - Mirror **`WorkerProfile` / `ChatRoom` / `ChatMessage`**: explicit **`@Column`** for the `…Id` UUID **above** the relation when you need indexing or clarity.
9. Use **`@Type(() => RelatedEntity)`** from `class-transformer` on relation properties.
10. Optional: **`Column({ comment: '…' })`** for non-obvious fields (see existing modules).

## Controllers (internal and other prefixes)

For panel/internal CRUD controllers, **do not hardcode** the resource segment after `internal/`. Use the entity’s static **`apiRouteName`**:

```ts
@Controller(`internal/${MyEntity.apiRouteName}`)
export class MyEntityInternalController {}
```

Example: **`src/app/modules/support/controllers/internal/careerCounselor.internal.controller.ts`**.

## Reference implementations (mirror in this order)

1. **`src/app/modules/worker/entities/workerProfile.entity.ts`** — **primary mirror** for **`tableName`**, **`apiRouteName`**, **`SEARCH_TERMS`** JSDoc and overall structure.
2. **`src/app/modules/support/entities/chatMessage.entity.ts`**
3. **`src/app/modules/support/entities/chatRoom.entity.ts`**
4. **`src/app/modules/support/entities/careerCounselor.entity.ts`** — pair with **`careerCounselor.internal.controller.ts`**, which uses **`CareerCounselor.apiRouteName`** on **`@Controller`**.

## Migrations — do not create by default

- **Do not create, add, or edit migration files** unless the developer **explicitly** asks you to.
- Developers generate and apply schema changes using the scripts in **`package.json`**, for example:
  - **`yarn migration:generate`** — generate migration from entity changes (runs pending migrations first, then the generate script).
  - **`yarn migration:create`** — create an empty migration via the project script.
  - **`yarn migration:run`** / **`yarn migration:revert`** — run or revert migrations.
- Only if you are **explicitly** asked to touch a migration: keep FK and index names consistent with **`makeForeignKeyName`** / **`makeIndexName`** in **`src/database/utils/index.ts`**.

## Old pattern (avoid for new work)

**`@Entity(ENUM_TABLE_NAMES.…)`** and raw **`@Index` / `@JoinColumn`** without the auto decorators — only for legacy entities until they are migrated.
