import { InputType, Field, ID } from "@nestjs/graphql";
import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { WorkspaceRole } from "../../common/enums";

@InputType()
export class AddWorkspaceMemberInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  email: string;

  @Field(() => String)
  @IsEnum(WorkspaceRole)
  @IsNotEmpty()
  role: WorkspaceRole;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  message?: string;
}
