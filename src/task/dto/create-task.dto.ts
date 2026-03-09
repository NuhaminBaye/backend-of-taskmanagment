import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";
import { Priority, TaskStatus, TaskType } from "../../common/enums";

export { TaskStatus, TaskType };

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsDateString()
  @IsNotEmpty()
  due_date: string;

  // workspaceId is sent from frontend but not used in backend
  // It's included here to avoid validation errors
  @IsString()
  @IsOptional()
  workspaceId?: string;
}
