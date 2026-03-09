import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [PrismaModule, NotificationModule],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
