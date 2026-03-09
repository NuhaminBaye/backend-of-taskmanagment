import { InputType, Field } from "@nestjs/graphql";
import { IsString, IsNotEmpty, IsEmail } from "class-validator";

@InputType()
export class AddProjectMemberInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
