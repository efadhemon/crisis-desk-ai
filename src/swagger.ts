import { INestApplication, Logger } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { ENV } from './env';

/**
 * Swagger UI Configuration
 * Production-grade settings for API documentation
 */
const swaggerUIConfig: SwaggerCustomOptions = {
  swaggerOptions: {
    // UI Layout & Organization
    docExpansion: 'none', // Collapse all sections by default for better performance
    tagsSorter: 'alpha', // Alphabetically sort API tags
    operationsSorter: (a: any, b: any) => {
      // Sort operations by HTTP method (GET, POST, PATCH, PUT, DELETE)
      const methodOrder = ['get', 'post', 'patch', 'put', 'delete'];
      return methodOrder.indexOf(a.get('method')) - methodOrder.indexOf(b.get('method'));
    },

    // Security & Authentication
    persistAuthorization: true, // Remember authorization between page refreshes

    // Performance & UX
    displayRequestDuration: true, // Show request execution time
    tryItOutEnabled: true, // Enable "Try it out" by default
    deepLinking: true, // Enable deep linking for sharing specific operations
    displayOperationId: false, // Hide operation IDs for cleaner UI
    showExtensions: false, // Hide vendor extensions
    showCommonExtensions: false, // Hide common extensions

    // Code Display & Syntax
    syntaxHighlight: {
      activate: true,
      theme: 'monokai', // Syntax highlighting theme
    },

    // Schema Display
    defaultModelsExpandDepth: 3, // How deep to expand model schemas
    defaultModelExpandDepth: 3, // Initial expansion depth
    defaultModelRendering: 'model', // Show models by default (vs example)

    // Request Configuration
    requestInterceptor: (req: any) => {
      // Add custom headers or modify requests if needed
      return req;
    },

    // Response Configuration
    responseInterceptor: (res: any) => {
      // Process responses if needed
      return res;
    },
  },
};

/**
 * Documentation Categories
 * Organize API endpoints by platform/audience
 */
const DOC_CATEGORIES = {
  APP: 'app',
};

/**
 * Security Scheme Names
 * Consistent naming for authentication schemes
 */
const SECURITY_SCHEMES = {
  BEARER: 'bearer',
};

/**
 * Filter routes by category for split documentation
 * @param doc - OpenAPI document
 * @param tag - Category tag to filter by
 * @returns Filtered OpenAPI document
 */
function filterApiRoutes(doc: OpenAPIObject, tag: string): OpenAPIObject {
  const publicDoc = structuredClone(doc);
  const paths = {};
  Object.entries(publicDoc.paths).map(([k, pathObj]) => {
    if (k.includes(`/${tag}/`)) {
      paths[k] = pathObj;
    }
  });
  publicDoc.paths = paths;
  publicDoc.info.title = `${publicDoc.info.title} - ${tag.charAt(0).toUpperCase() + tag.slice(1)}`;
  return publicDoc;
}

/**
 * Create base document builder with common configuration
 * @returns Configured DocumentBuilder instance
 */
function createBaseDocumentBuilder() {
  const builder = new DocumentBuilder()
    .setTitle(ENV.api.API_TITLE)
    .setDescription(ENV.api.API_DESCRIPTION)
    .setVersion(ENV.api.API_VERSION);

  return builder.addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token for user authentication',
      in: 'header',
    },
    SECURITY_SCHEMES.BEARER,
  );
}

/**
 * Setup Swagger documentation for the application
 * Creates multiple documentation endpoints for different platforms
 *
 * @param app - NestJS application instance
 */
export function setupSwagger(app: INestApplication): void {
  const logger = new Logger('SwaggerSetup');

  // Only enable Swagger in non-production environments by default
  const enableSwagger = !ENV.isProduction;

  if (!enableSwagger) {
    logger.log('Swagger documentation is disabled in production');
    return;
  }

  logger.log('Setting up Swagger documentation...');

  // Create base document configuration
  const options = createBaseDocumentBuilder().build();

  // Generate main OpenAPI document
  const document = SwaggerModule.createDocument(app, options, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
    deepScanRoutes: true, // Scan all routes including nested ones
  });

  // Create filtered documentation for different platforms
  const appDoc = filterApiRoutes(document, DOC_CATEGORIES.APP);

  // Base documentation path
  const baseDocPath = '/docs';

  // Setup documentation endpoints
  SwaggerModule.setup(baseDocPath, app, document, {
    ...swaggerUIConfig,
    customSiteTitle: 'WageHat API - Complete Documentation',
  });

  SwaggerModule.setup(`${baseDocPath}/app`, app, appDoc, {
    ...swaggerUIConfig,
    customSiteTitle: 'WageHat API - Mobile App',
  });

  // Log available documentation URLs
  logger.log('Swagger documentation is available at:');
  logger.log(`   Complete API: ${baseDocPath}`);
  logger.log(`   Mobile App: ${baseDocPath}/app`);

  // Export OpenAPI JSON (useful for CI/CD, testing, and external tools)
  if (process.env.EXPORT_OPENAPI_JSON === 'true') {
    const outputDir = path.join(process.cwd(), 'docs');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outputDir, 'openapi.json'), JSON.stringify(document, null, 2));
    logger.log('OpenAPI specification exported to docs/openapi.json');
  }
}
