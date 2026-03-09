import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { extractUserIdFromRequest } from "./user-id.util";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      let userId = extractUserIdFromRequest(request);
      if (userId) {
        const existingUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (!existingUser) {
          userId = undefined;
        }
      }

      if (!userId) {
        const fallbackUser = await this.prisma.user.findFirst({
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        userId = fallbackUser?.id;
      }

      if (!userId) {
        this.logger.warn(
          "No userId found in headers/env and no fallback user in database",
        );
        throw new UnauthorizedException("Unauthorized - No user ID found");
      }

      // Attach userId to request for use in controllers
      request.userId = userId;
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);

      // If it's already an HttpException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Otherwise, wrap it in UnauthorizedException
      throw new UnauthorizedException(error.message || "Unauthorized");
    }
  }
}
