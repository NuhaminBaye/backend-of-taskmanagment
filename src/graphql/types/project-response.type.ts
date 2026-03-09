import { ObjectType, Field } from "@nestjs/graphql";
import { Project } from "./project.type";

@ObjectType()
export class ProjectResponse {
  @Field(() => Project)
  project: Project;

  @Field()
  message: string;
}
