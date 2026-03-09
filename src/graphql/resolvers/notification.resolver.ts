import { Resolver, Query, Mutation, Context } from "@nestjs/graphql";
import { Notification } from "../types/notification.type";
import { NotificationService } from "../../notification/notification.service";

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private readonly notifications: NotificationService) {}

  @Query(() => [Notification])
  async notificationsQuery(@Context() context: any): Promise<Notification[]> {
    const userId = context.req.userId as string | undefined;
    if (!userId) {
      return [];
    }
    const items = await this.notifications.getForUser(userId);
    return items as unknown as Notification[];
  }

  @Mutation(() => Boolean)
  async markAllNotificationsRead(
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.userId as string | undefined;
    if (!userId) {
      return false;
    }
    return this.notifications.markAllRead(userId);
  }
}

