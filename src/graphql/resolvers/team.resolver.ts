import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { randomUUID } from "crypto";
import { Team, TeamMember } from "../types/team.type";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspaceRole } from "../../common/enums";
import { NotificationService } from "../../notification/notification.service";

@Resolver(() => Team)
export class TeamResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  @Query(() => [Team])
  async teams(@Context() context: any): Promise<Team[]> {
    const userId = context.req.userId;
    if (!userId) {
      return [];
    }

    const workspaces = await this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      members: workspace.members.map((member) => ({
        user: member.user,
        role: member.role,
      })) as TeamMember[],
    })) as unknown as Team[];
  }

  @Mutation(() => Team)
  async createTeam(
    @Args("name") name: string,
    @Context() context: any,
  ): Promise<Team> {
    const userId = context.req.userId as string | undefined;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        id: randomUUID(),
        name,
        slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        owner: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    await this.prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: WorkspaceRole.ADMIN,
      },
    });

    const fullWorkspace = await this.prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        members: { include: { user: true } },
      },
    });

    return {
      id: fullWorkspace.id,
      name: fullWorkspace.name,
      members: fullWorkspace.members.map((member) => ({
        user: member.user,
        role: member.role,
      })) as TeamMember[],
    } as unknown as Team;
  }

  @Mutation(() => String)
  async inviteTeamMember(
    @Args("teamId") teamId: string,
    @Args("email") email: string,
    @Args("role") role: string,
    @Context() context: any,
  ): Promise<string> {
    const userId = context.req.userId;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!workspace) {
      throw new Error("Team not found");
    }

    const actingMember = workspace.members.find(
      (member) => member.userId === userId,
    );

    if (!actingMember || actingMember.role !== WorkspaceRole.ADMIN) {
      throw new Error("Only admins can invite members");
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await this.prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: teamId,
        },
      },
      update: {
        role: role as WorkspaceRole,
      },
      create: {
        userId: user.id,
        workspaceId: teamId,
        role: role as WorkspaceRole,
      },
    });

    // Notify the invited user.
    await this.notifications.create(
      user.id,
      `You have been added to the team "${workspace.name}"`,
    );

    return "Invitation processed";
  }
}

