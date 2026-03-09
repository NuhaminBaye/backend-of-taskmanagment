import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { WorkspaceService } from "../../workspace/workspace.service";
import { WorkspacesResponse } from "../types/workspace-response.type";
import { AddWorkspaceMemberInput } from "../inputs/add-workspace-member.input";
import { InviteWorkspaceMemberInput } from "../inputs/invite-workspace-member.input";

@Resolver()
export class WorkspaceResolver {
  constructor(private workspaceService: WorkspaceService) {}

  @Query(() => WorkspacesResponse)
  async workspaces(@Context() context: any): Promise<WorkspacesResponse> {
    const userId = context.req.userId;
    const result = await this.workspaceService.getUserWorkspaces(userId);
    // Type assertion - Prisma includes createdAt/updatedAt automatically for members
    // Using double cast to handle enum and date field type mismatches
    return result as unknown as WorkspacesResponse;
  }

  @Mutation(() => String)
  async addWorkspaceMember(
    @Args("input") input: AddWorkspaceMemberInput,
    @Context() context: any,
  ): Promise<string> {
    const userId = context.req.userId;
    const result = await this.workspaceService.addMember(userId, {
      email: input.email,
      role: input.role,
      workspaceId: input.workspaceId,
      message: input.message,
    });
    return result.message;
  }

  @Mutation(() => String)
  async inviteWorkspaceMember(
    @Args("input") input: InviteWorkspaceMemberInput,
    @Context() context: any,
  ): Promise<string> {
    const userId = context.req.userId;
    const result = await this.workspaceService.inviteMember(userId, {
      email: input.email,
      role: input.role,
      workspaceId: input.workspaceId,
      message: input.message,
    });
    return result.message;
  }
}
