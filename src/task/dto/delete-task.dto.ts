import { IsArray, IsString } from "class-validator";

export class DeleteTaskDto {
  @IsArray()
  @IsString({ each: true })
  taskIds: string[];
}
