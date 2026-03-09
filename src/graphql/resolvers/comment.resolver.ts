import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { CommentService } from "../../comment/comment.service";
import { AddCommentInput } from "../inputs/add-comment.input";
import {
  CommentResponse,
  CommentsResponse,
} from "../types/comment-response.type";

@Resolver()
export class CommentResolver {
  constructor(private commentService: CommentService) {}

  @Mutation(() => CommentResponse)
  async addComment(
    @Args("input") input: AddCommentInput,
    @Context() context: any,
  ): Promise<CommentResponse> {
    const userId = context.req.userId;
    const result = await this.commentService.addComment(userId, {
      content: input.content,
      taskId: input.taskId,
    });
    // Type assertion - Prisma includes updatedAt automatically
    return result as unknown as CommentResponse;
  }

  @Query(() => CommentsResponse)
  async taskComments(
    @Args("taskId") taskId: string,
  ): Promise<CommentsResponse> {
    const result = await this.commentService.getTaskComments(taskId);
    // Type assertion - Prisma includes updatedAt automatically
    return result as unknown as CommentsResponse;
  }
}
