import { Controller, Post, Put, Body, Param, UseGuards } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { AuthGuard } from "../auth/auth.guard";
import { UserId } from "../auth/decorators/user.decorator";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { AddProjectMemberDto } from "./dto/add-member.dto";

@Controller("api/projects")
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  async createProject(
    @UserId() userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectService.createProject(userId, createProjectDto);
  }

  @Put()
  async updateProject(
    @UserId() userId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(userId, updateProjectDto);
  }

  @Post(":projectId/addMember")
  async addMember(
    @UserId() userId: string,
    @Param("projectId") projectId: string,
    @Body() addMemberDto: AddProjectMemberDto,
  ) {
    return this.projectService.addMember(userId, projectId, addMemberDto);
  }
}
