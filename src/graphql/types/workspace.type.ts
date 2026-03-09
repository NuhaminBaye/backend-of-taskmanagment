import { ObjectType, Field, ID } from "@nestjs/graphql";
import { User } from "./user.type";
import { WorkspaceMember } from "./workspace-member.type";
import { Project } from "./project.type";

@ObjectType()
export class Workspace {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  image_url?: string;

  @Field(() => ID)
  ownerId: string;

  @Field(() => User)
  owner: User;

  @Field(() => [WorkspaceMember])
  members: WorkspaceMember[];

  @Field(() => [Project])
  projects: Project[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
