import { metrics } from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { HostMetrics } from '@opentelemetry/host-metrics';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ENV } from './env';

let sdk: NodeSDK;

// Initialize OpenTelemetry SDK if observability is enabled
if (ENV.observability.enabled) {
  // Common OTLP headers for Grafana Cloud authentication
  const otlpHeaders = {
    Authorization: ENV.observability.otelExporterOtlpHeaders,
  };

  // Configure resource with service information
  const resource = resourceFromAttributes({
    'service.name': ENV.appName,
    'service.namespace': 'wageplatform',
    'deployment.environment': ENV.env,
  });

  // Configure OTLP trace exporter (Grafana Cloud Tempo)
  const traceExporter = new OTLPTraceExporter({
    url: `${ENV.observability.otelExporterOtlpEndpoint}/v1/traces`,
    headers: otlpHeaders,
  });

  // Configure OTLP metric exporter (Grafana Cloud Mimir)
  const metricExporter = new OTLPMetricExporter({
    url: `${ENV.observability.otelExporterOtlpEndpoint}/v1/metrics`,
    headers: otlpHeaders,
  });

  // Configure OTLP log exporter (Grafana Cloud Loki via OTLP)
  const logExporter = new OTLPLogExporter({
    url: `${ENV.observability.otelExporterOtlpEndpoint}/v1/logs`,
    headers: otlpHeaders,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Push metrics every 60s (free tier friendly)
  });

  // Initialize OpenTelemetry SDK
  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    logRecordProcessors: [new BatchLogRecordProcessor(logExporter)], // Registers logs
    instrumentations: [
      // Selective instrumentations only — avoids memory overhead of ~30+ auto-instrumentations
      // (pg, redis, dns, net, express, generic-pool, etc. were all monkey-patched before)
      new HttpInstrumentation(),
      new NestInstrumentation(),
    ],
  });

  // Start the SDK
  sdk.start();
  console.info('✓ OpenTelemetry SDK started (Traces, Metrics, & Logs)');

  // Enable Host Metrics for CPU and memory monitoring
  const hostMetrics = new HostMetrics({
    meterProvider: metrics.getMeterProvider(), // Use public API instead of private property
    name: `${ENV.appName}-host-metrics`,
  });
  hostMetrics.start();
  console.info('✓ Host Metrics started (CPU & Memory monitoring enabled)');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.info('OpenTelemetry terminated'))
      .catch((error) => console.error('Error terminating OpenTelemetry', error))
      .finally(() => process.exit(0));
  });
}

export default sdk;
