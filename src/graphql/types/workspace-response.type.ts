import { ObjectType, Field } from "@nestjs/graphql";
import { Workspace } from "./workspace.type";

@ObjectType()
export class WorkspacesResponse {
  @Field(() => [Workspace])
  workspaces: Workspace[];
}
