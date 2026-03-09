import { ObjectType, Field, ID } from "@nestjs/graphql";
import { User } from "./user.type";
import { WorkspaceRole } from "../../common/enums";

@ObjectType()
export class WorkspaceMember {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  workspaceId: string;

  @Field(() => String)
  role: WorkspaceRole;

  @Field({ nullable: true })
  message?: string;

  @Field(() => User)
  user: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
