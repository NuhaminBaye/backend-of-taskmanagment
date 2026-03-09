import { InputType, Field, ID } from "@nestjs/graphql";
import { IsString, IsNotEmpty } from "class-validator";

@InputType()
export class AddCommentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  taskId: string;
}
