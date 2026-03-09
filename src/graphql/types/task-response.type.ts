import { ObjectType, Field } from "@nestjs/graphql";
import { Task } from "./task.type";

@ObjectType()
export class TaskResponse {
  @Field(() => Task)
  task: Task;

  @Field()
  message: string;
}
