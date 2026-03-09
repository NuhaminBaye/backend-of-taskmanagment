import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

// Configure Neon WebSocket constructor for Node.js environment
// This is required for Neon serverless to work properly
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ws = require("ws");
  // Set the WebSocket constructor - this is required for Neon
  neonConfig.webSocketConstructor = ws;
} catch (error) {
  // In serverless environments, WebSocket might not be available
  // But Neon can use fetch-based connections which work in serverless
  console.warn(
    "WebSocket (ws) package not available, using fetch-based connections",
  );
}

// Enable fetch-based querying as fallback (more reliable in serverless)
// This uses HTTP instead of WebSocket when possible
if (typeof neonConfig.poolQueryViaFetch !== "undefined") {
  neonConfig.poolQueryViaFetch = true;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private client: PrismaClient | null = null;

  constructor() {
    const rawConnectionString = process.env.DATABASE_URL;

    const prismaOptions: Prisma.PrismaClientOptions = {
      log: ["error", "warn"],
    };

    const connectionString = this.normalizeDatabaseUrl(rawConnectionString);

    if (!connectionString) {
      this.logger.warn(
        "DATABASE_URL environment variable is not set. The application will start, but database operations will fail until it is configured.",
      );
    } else if (connectionString.includes("neon.tech")) {
      try {
        const adapter = new PrismaNeon({ connectionString });
        (prismaOptions as unknown as { adapter?: unknown }).adapter = adapter;
      } catch (error) {
        const errorMsg = `Failed to create Prisma Neon adapter: ${
          error instanceof Error ? error.message : String(error)
        }`;
        this.logger.error(errorMsg, error as Error);
      }
    }

    try {
      // Prevent Prisma from exhausting hosted DB connection limits in dev.
      // Many hosted Postgres providers (including Prisma Postgres) allow only a
      // small number of concurrent connections. Prisma's pool defaults can
      // exceed that under bursty GraphQL traffic.
      if (connectionString) {
        prismaOptions.datasources = {
          db: { url: this.withSafePooling(connectionString) },
        };
      }
      this.client = new PrismaClient(prismaOptions);
    } catch (error) {
      this.logger.error(
        '@prisma/client failed to initialize. Ensure that "prisma generate" has been run.',
        error as Error,
      );
      this.client = null;
    }
  }

  private ensureClient(): PrismaClient {
    if (!this.client) {
      throw new Error(
        "Database client is not initialized. Ensure DATABASE_URL is set and Prisma has been generated.",
      );
    }
    return this.client;
  }

  // Expose model delegates so existing services can continue to use `this.prisma.user...`
  get user() {
    return this.ensureClient().user;
  }

  get workspace() {
    return this.ensureClient().workspace;
  }

  get workspaceMember() {
    return this.ensureClient().workspaceMember;
  }

  get project() {
    return this.ensureClient().project;
  }

  get projectMember() {
    return this.ensureClient().projectMember;
  }

  get task() {
    return this.ensureClient().task;
  }

  get comment() {
    return this.ensureClient().comment;
  }

  get notification() {
    return this.ensureClient().notification;
  }

  async onModuleInit() {
    if (!this.client) {
      this.logger.warn(
        'Skipping database connection because Prisma client is not initialized. Configure DATABASE_URL and run "prisma generate".',
      );
      return;
    }

    try {
      await this.client.$connect();
      this.logger.log("Database connected successfully");
    } catch (error) {
      this.logger.error("Failed to connect to database:", error as Error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.$disconnect();
    }
  }

  private normalizeDatabaseUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }

  private withSafePooling(url: string): string {
    try {
      const parsed = new URL(url);
      // Only apply to postgres-style URLs.
      if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
        return url;
      }

      // Keep pools tiny for hosted DBs; queue rather than error.
      if (!parsed.searchParams.has("connection_limit")) {
        parsed.searchParams.set("connection_limit", "1");
      }
      if (!parsed.searchParams.has("pool_timeout")) {
        parsed.searchParams.set("pool_timeout", "60");
      }

      return parsed.toString();
    } catch {
      // If URL parsing fails, don't block startup.
      return url;
    }
  }
}
