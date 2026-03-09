import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { AddMemberDto } from "./dto/add-member.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { randomUUID } from "crypto";

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
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

    // Try to find an existing user to act as the current user
    const fallbackUser = await this.prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (fallbackUser) {
      return fallbackUser.id;
    }

    // Local/dev convenience: automatically create a default user
    const defaultUserId = process.env.DEFAULT_USER_ID || "local-user";
    const defaultEmail = process.env.DEFAULT_USER_EMAIL || "local@example.com";
    const defaultName = process.env.DEFAULT_USER_NAME || "Local User";

    const createdUser = await this.prisma.user.create({
      data: {
        id: defaultUserId,
        email: defaultEmail,
        name: defaultName,
        image: "",
      },
      select: { id: true },
    });

    return createdUser.id;
  }

  async getUserWorkspaces(userId?: string) {
    try {
      const actingUserId = await this.resolveActingUserId(userId);

      let workspaces = await this.prisma.workspace.findMany({
        where: {
          members: { some: { userId: actingUserId } },
        },
        include: {
          members: { include: { user: true } },
          projects: {
            include: {
              tasks: {
                include: {
                  assignee: true,
                  comments: { include: { user: true } },
                },
              },
              members: { include: { user: true } },
            },
          },
          owner: true,
        },
      });

      // If the acting user has no workspaces yet, automatically create a default one
      if (workspaces.length === 0) {
        const user = await this.prisma.user.findUnique({
          where: { id: actingUserId },
        });

        if (!user) {
          throw new UnauthorizedException(
            "Unable to resolve user for workspace creation",
          );
        }

        const workspaceId = randomUUID();
        const slugBase =
          user.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
          "default-workspace";

        const workspace = await this.prisma.workspace.create({
          data: {
            id: workspaceId,
            name: `${user.name || "My"} Workspace`,
            slug: `${slugBase}-${workspaceId.slice(0, 8)}`,
            description: "Default workspace created for local user.",
            ownerId: actingUserId,
            // image_url left as default empty string so frontend falls back to default icon
          },
        });

        await this.prisma.workspaceMember.create({
          data: {
            userId: actingUserId,
            workspaceId: workspace.id,
            role: "ADMIN",
          },
        });

        // Re-load workspaces including relations
        workspaces = await this.prisma.workspace.findMany({
          where: {
            members: { some: { userId: actingUserId } },
          },
          include: {
            members: { include: { user: true } },
            projects: {
              include: {
                tasks: {
                  include: {
                    assignee: true,
                    comments: { include: { user: true } },
                  },
                },
                members: { include: { user: true } },
              },
            },
            owner: true,
          },
        });
      }

      return { workspaces };
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      throw error;
    }
  }

  async addMember(userId: string, addMemberDto: AddMemberDto) {
    const actingUserId = await this.resolveActingUserId(userId);
    const { email, role, workspaceId, message } = addMemberDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      throw new BadRequestException("Invalid role");
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    // Check if user has admin role
    const isAdmin = workspace.members.find(
      (member) => member.userId === actingUserId && member.role === "ADMIN",
    );

    if (!isAdmin) {
      throw new UnauthorizedException("You do not have admin privileges");
    }

    // Check if user is already a member
    const existingMember = workspace.members.find(
      (member) => member.userId === user.id,
    );

    if (existingMember) {
      throw new BadRequestException("User is already a member");
    }

    const member = await this.prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role,
        message: message || "",
      },
    });

    // Send invitation email to the new member
    try {
      const workspaceOwner = await this.prisma.user.findUnique({
        where: { id: workspace.ownerId },
        select: { name: true },
      });

      await this.emailService.sendEmail({
        to: email,
        subject: `You've been invited to join ${workspace.name}`,
        body: `
<div style="max-width:600px; margin:0 auto; font-family:Arial, sans-serif;">
  <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:30px; text-align:center; border-radius:10px 10px 0 0;">
    <h1 style="color:#fff; margin:0; font-size:24px;">Workspace Invitation</h1>
  </div>
  
  <div style="padding:30px; background:#fff; border:1px solid #e0e0e0; border-radius:0 0 10px 10px;">
    <h2 style="color:#333; margin-top:0;">Hi ${user.name || email}, 👋</h2>
    
    <p style="color:#666; font-size:16px; line-height:1.6;">
      ${workspaceOwner?.name || "A team member"} has invited you to join the workspace:
    </p>
    
    <div style="background:#f8f9fa; border-left:4px solid #667eea; padding:20px; margin:20px 0; border-radius:5px;">
      <h3 style="color:#667eea; margin:0 0 10px 0; font-size:20px;">${workspace.name}</h3>
      ${workspace.description ? `<p style="color:#666; margin:10px 0 0 0;">${workspace.description}</p>` : ""}
      <p style="color:#666; margin:10px 0 0 0;">
        <strong>Role:</strong> ${role}
      </p>
    </div>
    
    ${
      message
        ? `
    <div style="background:#fff3cd; border:1px solid #ffc107; padding:15px; margin:20px 0; border-radius:5px;">
      <p style="color:#856404; margin:0; font-style:italic;">"${message}"</p>
    </div>
    `
        : ""
    }
    
    <p style="color:#666; font-size:16px; line-height:1.6;">
      You can now access this workspace and start collaborating with your team.
    </p>
    
    <div style="text-align:center; margin:30px 0;">
      <a 
        href="${process.env.FRONTEND_URL || "http://localhost:5173"}" 
        style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:15px 30px; text-decoration:none; border-radius:5px; font-weight:600; display:inline-block; font-size:16px;">
        Access Workspace
      </a>
    </div>
    
    <p style="color:#999; font-size:12px; margin-top:30px; border-top:1px solid #e0e0e0; padding-top:20px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</div>
        `,
      });
      this.logger.log(
        `Invitation email sent successfully to ${email} for workspace ${workspace.name}`,
      );
    } catch (emailError) {
      // Log error but don't fail the member addition
      this.logger.error(
        `Failed to send invitation email to ${email}:`,
        emailError,
      );
      // Continue - member is still added even if email fails
    }

    return { member, message: "Member added successfully" };
  }

  async inviteMember(userId: string, inviteMemberDto: InviteMemberDto) {
    const actingUserId = await this.resolveActingUserId(userId);
    const { email, role, workspaceId, message } = inviteMemberDto;

    if (!["ADMIN", "MEMBER"].includes(role)) {
      throw new BadRequestException("Invalid role");
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: true, members: { include: { user: true } } },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    // Check if user has admin role
    const isAdmin = workspace.members.find(
      (member) => member.userId === actingUserId && member.role === "ADMIN",
    );

    if (!isAdmin) {
      throw new UnauthorizedException("You do not have admin privileges");
    }

    // Check if user is already a member
    const existingMember = workspace.members.find(
      (member) => member.user.email === email,
    );

    if (existingMember) {
      throw new BadRequestException("User is already a member");
    }

    // Get inviter info
    const inviter = await this.prisma.user.findUnique({
      where: { id: actingUserId },
      select: { name: true, email: true },
    });

    // Send invitation email
    try {
      await this.emailService.sendEmail({
        to: email,
        subject: `You've been invited to join ${workspace.name}`,
        body: `
<div style="max-width:600px; margin:0 auto; font-family:Arial, sans-serif;">
  <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:30px; text-align:center; border-radius:10px 10px 0 0;">
    <h1 style="color:#fff; margin:0; font-size:24px;">Workspace Invitation</h1>
  </div>
  
  <div style="padding:30px; background:#fff; border:1px solid #e0e0e0; border-radius:0 0 10px 10px;">
    <h2 style="color:#333; margin-top:0;">Hi there, 👋</h2>
    
    <p style="color:#666; font-size:16px; line-height:1.6;">
      ${inviter?.name || "A team member"} has invited you to join the workspace:
    </p>
    
    <div style="background:#f8f9fa; border-left:4px solid #667eea; padding:20px; margin:20px 0; border-radius:5px;">
      <h3 style="color:#667eea; margin:0 0 10px 0; font-size:20px;">${workspace.name}</h3>
      ${workspace.description ? `<p style="color:#666; margin:10px 0 0 0;">${workspace.description}</p>` : ""}
      <p style="color:#666; margin:10px 0 0 0;">
        <strong>Role:</strong> ${role}
      </p>
    </div>
    
    ${
      message
        ? `
    <div style="background:#fff3cd; border:1px solid #ffc107; padding:15px; margin:20px 0; border-radius:5px;">
      <p style="color:#856404; margin:0; font-style:italic;">"${message}"</p>
    </div>
    `
        : ""
    }
    
    <p style="color:#666; font-size:16px; line-height:1.6;">
      Click the button below to accept the invitation and start collaborating with your team.
    </p>
    
    <div style="text-align:center; margin:30px 0;">
      <a 
        href="${process.env.FRONTEND_URL || "http://localhost:5173"}" 
        style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:15px 30px; text-decoration:none; border-radius:5px; font-weight:600; display:inline-block; font-size:16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="color:#999; font-size:12px; margin-top:30px; border-top:1px solid #e0e0e0; padding-top:20px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</div>
        `,
      });
      this.logger.log(
        `Invitation email sent successfully to ${email} for workspace ${workspace.name}`,
      );
      return {
        message: "Invitation email sent successfully",
        email,
        workspace: workspace.name,
      };
    } catch (emailError: any) {
      // For local/dev use, we don't want email failures to break the mutation.
      // Log the error and still report success so the UI can proceed.
      this.logger.error(
        `Failed to send invitation email to ${email}:`,
        emailError,
      );
      return {
        message:
          "Invitation created, but email could not be sent (email disabled or misconfigured).",
        email,
        workspace: workspace.name,
      };
    }
  }
}
