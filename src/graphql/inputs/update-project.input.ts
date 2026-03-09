import { InputType, Field, ID, Int } from "@nestjs/graphql";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { ProjectStatus, Priority } from "../../common/enums";

@InputType()
export class UpdateProjectInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @Field(() => String, { nullable: true })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;
}
