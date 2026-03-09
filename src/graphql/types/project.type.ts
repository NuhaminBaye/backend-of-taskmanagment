import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { User } from "./user.type";
import { ProjectMember } from "./project-member.type";
import { Task } from "./task.type";
import { ProjectStatus, Priority } from "../../common/enums";

@ObjectType()
export class Project {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => String)
  status: ProjectStatus;

  @Field(() => String)
  priority: Priority;

  @Field(() => Int)
  progress: number;

  @Field(() => ID)
  workspaceId: string;

  @Field(() => ID, { nullable: true })
  team_lead?: string;

  @Field(() => User, { nullable: true })
  owner?: User;

  @Field({ nullable: true })
  start_date?: Date;

  @Field({ nullable: true })
  end_date?: Date;

  @Field(() => [ProjectMember])
  members: ProjectMember[];

  @Field(() => [Task])
  tasks: Task[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
