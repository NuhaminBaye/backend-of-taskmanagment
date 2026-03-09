import { ObjectType, Field } from "@nestjs/graphql";
import { User } from "./user.type";

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field({ nullable: true })
  refreshToken?: string;

  @Field(() => User)
  user: User;
}

