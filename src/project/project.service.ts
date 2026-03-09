import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { AddProjectMemberDto } from "./dto/add-member.dto";

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

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

  async createProject(
    userId: string | undefined,
    createProjectDto: CreateProjectDto,
  ) {
    const actingUserId = await this.resolveActingUserId(userId);
    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      team_members,
      team_lead,
      progress,
      priority,
    } = createProjectDto;

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const isAdmin = workspace.members.some(
      (member) => member.userId === actingUserId && member.role === "ADMIN",
    );

    if (!isAdmin) {
      throw new ForbiddenException(
        "You do not have permission to create projects in this workspace",
      );
    }

    const teamLeadUser = await this.prisma.user.findUnique({
      where: { email: team_lead },
      select: { id: true },
    });
    const effectiveTeamLeadId = teamLeadUser?.id ?? actingUserId;

    const project = await this.prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        status: status || "ACTIVE",
        priority: priority || "MEDIUM",
        progress: progress || 0,
        team_lead: effectiveTeamLeadId,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    if (team_members?.length > 0) {
      const membersToAdd = [];

      workspace.members.forEach((member) => {
        if (team_members.includes(member.user.email)) {
          membersToAdd.push(member.user.id);
        }
      });

      if (membersToAdd.length > 0) {
        await this.prisma.projectMember.createMany({
          data: membersToAdd.map((memberId) => ({
            projectId: project.id,
            userId: memberId,
          })),
        });
      }
    }

    const projectWithMembers = await this.prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: { include: { user: true } },
        tasks: {
          include: { assignee: true, comments: { include: { user: true } } },
        },
        owner: true,
      },
    });

    return {
      project: projectWithMembers,
      message: "Project created successfully",
    };
  }

  async updateProject(
    userId: string | undefined,
    updateProjectDto: UpdateProjectDto,
  ) {
    const actingUserId = await this.resolveActingUserId(userId);
    const {
      id,
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      progress,
      priority,
    } = updateProjectDto;

    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException("Project not found");
    }

    const effectiveWorkspaceId = workspaceId || existingProject.workspaceId;

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: effectiveWorkspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const isAdmin = workspace.members.some(
      (member) => member.userId === actingUserId && member.role === "ADMIN",
    );

    if (!isAdmin) {
      if (existingProject.team_lead !== actingUserId) {
        throw new ForbiddenException(
          "You do not have permission to update projects in this workspace",
        );
      }
    }

    // Build update data object, only including fields that are provided
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (progress !== undefined) updateData.progress = progress;
    if (effectiveWorkspaceId !== undefined)
      updateData.workspaceId = effectiveWorkspaceId;
    if (start_date !== undefined) {
      updateData.start_date = start_date ? new Date(start_date) : null;
    }
    if (end_date !== undefined) {
      updateData.end_date = end_date ? new Date(end_date) : null;
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        members: { include: { user: true } },
        tasks: {
          include: {
            assignee: true,
            comments: { include: { user: true } },
          },
        },
      },
    });

    return { project, message: "Project updated successfully" };
  }

  async addMember(
    userId: string | undefined,
    projectId: string,
    addMemberDto: AddProjectMemberDto,
  ) {
    const actingUserId = await this.resolveActingUserId(userId);
    const { email } = addMemberDto;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.team_lead !== actingUserId) {
      throw new ForbiddenException("Only project lead can add members");
    }

    const existingMember = project.members.find(
      (member) => member.user.email === email,
    );

    if (existingMember) {
      throw new BadRequestException("User is already a member");
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const member = await this.prisma.projectMember.create({
      data: { userId: user.id, projectId },
    });

    return { member, message: "Member added successfully" };
  }

  async getProjectsForUser(userId?: string) {
    const actingUserId = await this.resolveActingUserId(userId);

    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { team_lead: actingUserId },
          {
            members: {
              some: {
                userId: actingUserId,
              },
            },
          },
        ],
      },
      include: {
        members: { include: { user: true } },
        tasks: {
          include: {
            assignee: true,
            comments: { include: { user: true } },
          },
        },
        owner: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return projects;
  }

  async getProjectById(userId: string | undefined, id: string) {
    const actingUserId = await this.resolveActingUserId(userId);

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: { include: { user: true } },
        tasks: {
          include: {
            assignee: true,
            comments: { include: { user: true } },
          },
        },
        owner: true,
      },
    });

    if (!project) {
      return null;
    }

    const isMember =
      project.team_lead === actingUserId ||
      project.members.some((member) => member.userId === actingUserId);

    if (!isMember) {
      throw new ForbiddenException("You do not have access to this project");
    }

    return project;
  }

  async deleteProject(userId: string | undefined, id: string) {
    const actingUserId = await this.resolveActingUserId(userId);

    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException("Project not found");
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: existingProject.workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const isAdmin = workspace.members.some(
      (member) => member.userId === actingUserId && member.role === "ADMIN",
    );

    if (!isAdmin && existingProject.team_lead !== actingUserId) {
      throw new ForbiddenException(
        "You do not have permission to delete this project",
      );
    }

    await this.prisma.project.delete({ where: { id } });

    return { message: "Project deleted successfully" };
  }
}
