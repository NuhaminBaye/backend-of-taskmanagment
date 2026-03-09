import { Module } from "@nestjs/common";
import { CommentService } from "./comment.service";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [PrismaModule, NotificationModule],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
