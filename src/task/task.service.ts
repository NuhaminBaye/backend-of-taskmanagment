import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationService } from "../notification/notification.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { DeleteTaskDto } from "./dto/delete-task.dto";

@Injectable()
export class TaskService {
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

  async createTask(userId: string | undefined, createTaskDto: CreateTaskDto) {
    const actingUserId = await this.resolveActingUserId(userId);
    const {
      projectId,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      due_date,
    } = createTaskDto;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.team_lead !== actingUserId) {
      throw new ForbiddenException(
        "You do not have admin privileges for this project",
      );
    }

    if (
      assigneeId &&
      !project.members.find((member) => member.user.id === assigneeId)
    ) {
      throw new ForbiddenException("Assignee is not a member of the project");
    }

    const task = await this.prisma.task.create({
      data: {
        projectId,
        title,
        description,
        priority: priority || "MEDIUM",
        assigneeId: assigneeId || project.team_lead,
        status: status || "TODO",
        type: type || "TASK",
        due_date: new Date(due_date),
      },
    });

    const taskWithAssignee = await this.prisma.task.findUnique({
      where: { id: task.id },
      include: { assignee: true },
    });

    // Notify the assignee that a task was assigned to them.
    if (taskWithAssignee?.assigneeId) {
      await this.notifications.create(
        taskWithAssignee.assigneeId,
        `You have been assigned a new task: "${taskWithAssignee.title}"`,
      );
    }

    return {
      task: taskWithAssignee,
      message: "Task created successfully",
    };
  }

  async updateTask(
    userId: string | undefined,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
  ) {
    const actingUserId = await this.resolveActingUserId(userId);
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

    if (project.team_lead !== actingUserId) {
      throw new ForbiddenException(
        "You do not have admin privileges for this project",
      );
    }

    const previousStatus = task.status;
    const previousAssigneeId = task.assigneeId;

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: updateTaskDto,
      include: {
        assignee: true,
        project: true,
      },
    });

    // Notify when status changes.
    if (updateTaskDto.status && updateTaskDto.status !== previousStatus) {
      await this.notifications.create(
        updatedTask.assigneeId,
        `Task "${updatedTask.title}" status changed to ${updateTaskDto.status}`,
      );
    }

    // Notify when assignee changes.
    if (
      updateTaskDto.assigneeId &&
      updateTaskDto.assigneeId !== previousAssigneeId
    ) {
      await this.notifications.create(
        updateTaskDto.assigneeId,
        `You have been assigned task: "${updatedTask.title}"`,
      );
    }

    return { task: updatedTask, message: "Task updated successfully" };
  }

  async deleteTask(userId: string | undefined, deleteTaskDto: DeleteTaskDto) {
    const actingUserId = await this.resolveActingUserId(userId);
    const { taskIds } = deleteTaskDto;

    const tasks = await this.prisma.task.findMany({
      where: { id: { in: taskIds } },
    });

    if (tasks.length === 0) {
      throw new NotFoundException("Task not found");
    }

    const project = await this.prisma.project.findUnique({
      where: { id: tasks[0].projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.team_lead !== actingUserId) {
      throw new ForbiddenException(
        "You do not have admin privileges for this project",
      );
    }

    await this.prisma.task.deleteMany({ where: { id: { in: taskIds } } });

    return { message: "Task deleted successfully" };
  }

  async getTasksForProject(projectId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: true,
        comments: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return tasks;
  }
}
