import { IsEmail, IsNotEmpty } from "class-validator";

export class AddProjectMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
