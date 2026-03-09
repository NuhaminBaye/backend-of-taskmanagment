import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../src/common/http-exception.filter';

// Use require for serverless-http as it may not have TypeScript definitions
const serverless = require('serverless-http');

let cachedApp: express.Express;
let serverlessHandler: any;
let isInitializing = false;
let initializationError: Error | null = null;

async function bootstrap() {
  // If already initialized, return cached handler
  if (serverlessHandler) {
    return serverlessHandler;
  }

  // If initialization is in progress, wait for it
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (initializationError) {
      throw initializationError;
    }
    return serverlessHandler;
  }

  // Start initialization
  isInitializing = true;
  initializationError = null;

  try {
    console.log('[BOOTSTRAP] Starting NestJS application initialization...');
    console.log('[BOOTSTRAP] Node version:', process.version);
    console.log('[BOOTSTRAP] Environment:', process.env.NODE_ENV || 'production');
    
    // Check required environment variables
    console.log('[BOOTSTRAP] Checking environment variables...');
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    console.log('[BOOTSTRAP] DATABASE_URL is set');
    
    console.log('[BOOTSTRAP] Creating Express app...');
    const expressApp = express();
    
    console.log('[BOOTSTRAP] Creating NestJS application...');
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: ['error', 'warn', 'log'] } // Enable logging for debugging
    );
    console.log('[BOOTSTRAP] NestJS application created');

    console.log('[BOOTSTRAP] Enabling CORS...');
    // Enable CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
    console.log('[BOOTSTRAP] CORS enabled');

    console.log('[BOOTSTRAP] Setting up global filters and pipes...');
    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    console.log('[BOOTSTRAP] Global filters and pipes configured');

    console.log('[BOOTSTRAP] Initializing NestJS application...');
    await app.init();
    console.log('[BOOTSTRAP] NestJS application initialized');
    
    cachedApp = expressApp;
    console.log('[BOOTSTRAP] Creating serverless handler...');
    serverlessHandler = serverless(cachedApp, {
      binary: ['image/*', 'application/octet-stream'],
    });
    
    console.log('[BOOTSTRAP] NestJS application initialized successfully');
    isInitializing = false;
    return serverlessHandler;
  } catch (error) {
    console.error('[BOOTSTRAP] Failed to initialize NestJS application');
    console.error('[BOOTSTRAP] Error type:', error?.constructor?.name);
    console.error('[BOOTSTRAP] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[BOOTSTRAP] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    initializationError = error as Error;
    isInitializing = false;
    throw error;
  }
}

export default async function handler(event: any, context: any) {
  try {
    console.log('[HANDLER] Function invoked');
    console.log('[HANDLER] Event method:', event?.httpMethod || event?.requestContext?.http?.method || 'UNKNOWN');
    console.log('[HANDLER] Event path:', event?.path || event?.rawPath || 'UNKNOWN');
    
    // Set callbackWaitsForEmptyEventLoop to false for better performance
    if (context && typeof context.callbackWaitsForEmptyEventLoop !== 'undefined') {
      context.callbackWaitsForEmptyEventLoop = false;
    }
    
    const handlerFn = await bootstrap();
    console.log('[HANDLER] Bootstrap completed, invoking handler...');
    const result = await handlerFn(event, context);
    console.log('[HANDLER] Handler completed successfully');
    return result;
  } catch (error) {
    console.error('[HANDLER] Serverless function error');
    console.error('[HANDLER] Error type:', error?.constructor?.name);
    console.error('[HANDLER] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[HANDLER] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return a proper error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Internal server error',
        error: 'FUNCTION_INVOCATION_FAILED',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? {
          name: error.name,
          stack: error.stack,
        } : undefined,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
}
