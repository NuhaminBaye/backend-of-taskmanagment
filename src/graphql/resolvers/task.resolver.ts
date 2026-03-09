import { Resolver, Mutation, Args, Context, Query } from "@nestjs/graphql";
import { TaskService } from "../../task/task.service";
import { CreateTaskInput } from "../inputs/create-task.input";
import { UpdateTaskInput } from "../inputs/update-task.input";
import { DeleteTaskInput } from "../inputs/delete-task.input";
import { TaskResponse } from "../types/task-response.type";
import { Task } from "../types/task.type";

@Resolver()
export class TaskResolver {
  constructor(private taskService: TaskService) {}

  @Query(() => [Task])
  async tasks(
    @Args("projectId") projectId: string,
  ): Promise<Task[]> {
    const result = await this.taskService.getTasksForProject(projectId);
    return result as unknown as Task[];
  }

  @Mutation(() => TaskResponse)
  async createTask(
    @Args("input") input: CreateTaskInput,
    @Context() context: any,
  ): Promise<TaskResponse> {
    const userId = context.req.userId;
    const result = await this.taskService.createTask(userId, {
      ...input,
      projectId: input.projectId,
    });
    // Type assertion to handle Prisma enum vs GraphQL enum mismatch
    return result as unknown as TaskResponse;
  }

  @Mutation(() => TaskResponse)
  async updateTask(
    @Args("taskId") taskId: string,
    @Args("input") input: UpdateTaskInput,
    @Context() context: any,
  ): Promise<TaskResponse> {
    const userId = context.req.userId;
    const result = await this.taskService.updateTask(userId, taskId, input);
    // Type assertion to handle Prisma enum vs GraphQL enum mismatch
    return result as unknown as TaskResponse;
  }

  @Mutation(() => String)
  async deleteTasks(
    @Args("input") input: DeleteTaskInput,
    @Context() context: any,
  ): Promise<string> {
    const userId = context.req.userId;
    const result = await this.taskService.deleteTask(userId, {
      taskIds: input.taskIds,
    });
    return result.message;
  }
}
