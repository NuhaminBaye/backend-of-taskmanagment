import { Resolver, Mutation, Args, Context, Query } from "@nestjs/graphql";
import { ProjectService } from "../../project/project.service";
import { CreateProjectInput } from "../inputs/create-project.input";
import { UpdateProjectInput } from "../inputs/update-project.input";
import { AddProjectMemberInput } from "../inputs/add-project-member.input";
import { ProjectResponse } from "../types/project-response.type";
import { Project } from "../types/project.type";

@Resolver()
export class ProjectResolver {
  constructor(private projectService: ProjectService) {}

  @Query(() => [Project])
  async projects(@Context() context: any): Promise<Project[]> {
    const userId = context.req.userId;
    const result = await this.projectService.getProjectsForUser(userId);
    return result as unknown as Project[];
  }

  @Query(() => Project, { nullable: true })
  async project(
    @Args("id") id: string,
    @Context() context: any,
  ): Promise<Project | null> {
    const userId = context.req.userId;
    const result = await this.projectService.getProjectById(userId, id);
    return result as unknown as Project | null;
  }

  @Mutation(() => ProjectResponse)
  async createProject(
    @Args("input") input: CreateProjectInput,
    @Context() context: any,
  ): Promise<ProjectResponse> {
    const userId = context.req.userId;
    const result = await this.projectService.createProject(userId, {
      ...input,
      workspaceId: input.workspaceId,
    });

    return result as unknown as ProjectResponse;
  }

  @Mutation(() => ProjectResponse)
  async updateProject(
    @Args("input") input: UpdateProjectInput,
    @Context() context: any,
  ): Promise<ProjectResponse> {
    const userId = context.req.userId;
    const result = await this.projectService.updateProject(userId, {
      ...input,
      workspaceId: input.workspaceId,
    });

    return result as unknown as ProjectResponse;
  }

  @Mutation(() => String)
  async addProjectMember(
    @Args("projectId") projectId: string,
    @Args("input") input: AddProjectMemberInput,
    @Context() context: any,
  ): Promise<string> {
    const userId = context.req.userId;
    const result = await this.projectService.addMember(userId, projectId, {
      email: input.email,
    });
    return result.message;
  }

  @Mutation(() => String)
  async deleteProject(
    @Args("id") id: string,
    @Context() context: any,
  ): Promise<string> {
    const userId = context.req.userId;
    const result = await this.projectService.deleteProject(userId, id);
    return result.message;
  }
}
