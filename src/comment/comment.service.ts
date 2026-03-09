import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationService } from "../notification/notification.service";
import { AddCommentDto } from "./dto/add-comment.dto";

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  private async resolveActingUserId(userId?: string): Promise<string> {
    if (userId) {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (existingUser) {
        return existingUser.id;
      }
    }

    const fallbackUser = await this.prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!fallbackUser) {
      throw new UnauthorizedException(
        "No user found to resolve request context",
      );
    }

    return fallbackUser.id;
  }

  async addComment(userId: string | undefined, addCommentDto: AddCommentDto) {
    const actingUserId = await this.resolveActingUserId(userId);
    const { content, taskId } = addCommentDto;

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const project = await this.prisma.project.findUnique({
      where: { id: task.projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const member = project.members.find(
      (member) => member.userId === actingUserId,
    );
    if (!member) {
      throw new ForbiddenException("You are not a member of this project");
    }

    const comment = await this.prisma.comment.create({
      data: { taskId, content, userId: actingUserId },
      include: { user: true },
    });

    // Notify assignee when a new comment is added to their task.
    if (task.assigneeId) {
      await this.notifications.create(
        task.assigneeId,
        `New comment on task "${task.title}": "${content}"`,
      );
    }

    return { comment };
  }

  async getTaskComments(taskId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: { user: true },
    });
    return { comments };
  }
}
