import { ObjectType, Field, ID } from "@nestjs/graphql";
import { User } from "./user.type";

@ObjectType()
export class ProjectMember {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  projectId: string;

  @Field(() => User)
  user: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
