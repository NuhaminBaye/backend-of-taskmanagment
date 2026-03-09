import { InputType, Field, ID } from "@nestjs/graphql";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";
import { Priority, TaskStatus, TaskType } from "../../common/enums";

@InputType()
export class CreateTaskInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @Field(() => String, { nullable: true })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @Field(() => String, { nullable: true })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @Field()
  @IsDateString()
  @IsNotEmpty()
  due_date: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  workspaceId?: string;
}
