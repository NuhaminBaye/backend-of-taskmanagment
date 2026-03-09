import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field()
  message: string;

  @Field()
  createdAt: Date;

  @Field()
  read: boolean;
}

