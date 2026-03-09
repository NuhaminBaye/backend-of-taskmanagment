import { ObjectType, Field } from "@nestjs/graphql";
import { Comment } from "./comment.type";

@ObjectType()
export class CommentResponse {
  @Field(() => Comment)
  comment: Comment;
}

@ObjectType()
export class CommentsResponse {
  @Field(() => [Comment])
  comments: Comment[];
}
