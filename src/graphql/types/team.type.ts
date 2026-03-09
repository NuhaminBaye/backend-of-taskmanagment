import { ObjectType, Field, ID } from "@nestjs/graphql";
import { User } from "./user.type";

@ObjectType()
export class TeamMember {
  @Field(() => User)
  user: User;

  @Field(() => String)
  role: string;
}

@ObjectType()
export class Team {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => [TeamMember])
  members: TeamMember[];
}

