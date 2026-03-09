import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { EmailModule } from "./email/email.module";
import { WorkspaceModule } from "./workspace/workspace.module";
import { ProjectModule } from "./project/project.module";
import { TaskModule } from "./task/task.module";
import { CommentModule } from "./comment/comment.module";
import { GraphqlModule } from "./graphql/graphql.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EmailModule,
    WorkspaceModule,
    ProjectModule,
    TaskModule,
    CommentModule,
    GraphqlModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
