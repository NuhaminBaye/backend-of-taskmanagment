import { ObjectType, Field, ID } from "@nestjs/graphql";
import { User } from "./user.type";
import { Comment } from "./comment.type";
import { Priority, TaskStatus, TaskType } from "../../common/enums";

@ObjectType()
export class Task {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => String)
  type: TaskType;

  @Field(() => String)
  status: TaskStatus;

  @Field(() => String)
  priority: Priority;

  @Field(() => ID, { nullable: true })
  assigneeId?: string;

  @Field(() => User, { nullable: true })
  assignee?: User;

  @Field(() => ID)
  projectId: string;

  @Field()
  due_date: Date;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
