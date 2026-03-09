import { InputType, Field } from "@nestjs/graphql";
import { IsArray, IsString, ArrayNotEmpty } from "class-validator";

@InputType()
export class DeleteTaskInput {
  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  taskIds: string[];
}
