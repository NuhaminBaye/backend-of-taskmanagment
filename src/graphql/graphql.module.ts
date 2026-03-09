import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { WorkspaceResolver } from "./resolvers/workspace.resolver";
import { ProjectResolver } from "./resolvers/project.resolver";
import { TaskResolver } from "./resolvers/task.resolver";
import { CommentResolver } from "./resolvers/comment.resolver";
import { TeamResolver } from "./resolvers/team.resolver";
import { AuthResolver } from "./resolvers/auth.resolver";
import { NotificationResolver } from "./resolvers/notification.resolver";
import { WorkspaceModule } from "../workspace/workspace.module";
import { ProjectModule } from "../project/project.module";
import { TaskModule } from "../task/task.module";
import { CommentModule } from "../comment/comment.module";
import { NotificationModule } from "../notification/notification.module";
import { extractUserIdFromRequest } from "../auth/user-id.util";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      path: "/graphql",
      context: ({ req }) => {
        const userId = req ? extractUserIdFromRequest(req) : undefined;

        // Attach userId to request for resolvers
        if (req) {
          req.userId = userId;
        }

        return { req };
      },
      playground: process.env.NODE_ENV !== "production",
      introspection: true,
      formatError: (error) => {
        return {
          message: error.message,
          code: error.extensions?.code,
          statusCode: error.extensions?.statusCode || 500,
        };
      },
    }),
    WorkspaceModule,
    ProjectModule,
    TaskModule,
    CommentModule,
    NotificationModule,
  ],
  providers: [
    WorkspaceResolver,
    ProjectResolver,
    TaskResolver,
    CommentResolver,
    TeamResolver,
    AuthResolver,
    NotificationResolver,
  ],
})
export class GraphqlModule {}
