import { ObjectType, Field, ID } from "@nestjs/graphql";
import { User } from "./user.type";

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => ID)
  taskId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => User)
  user: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
