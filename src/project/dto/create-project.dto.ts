import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
} from "class-validator";
import { ProjectStatus, Priority } from "../../common/enums";

export { ProjectStatus, Priority };

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  team_members?: string[];

  @IsString()
  @IsNotEmpty()
  team_lead: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;
}
