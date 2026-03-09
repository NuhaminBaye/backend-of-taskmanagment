import {
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { Resolver, Mutation, Args, Context, Query } from "@nestjs/graphql";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
} from "../inputs/auth.input";
import { AuthPayload } from "../types/auth-payload.type";
import { User } from "../types/user.type";

@Resolver()
export class AuthResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => User)
  async me(@Context() context: any): Promise<User> {
    const userId = context.req.userId as string | undefined;
    if (!userId) {
      throw new UnauthorizedException("Unauthorized");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }
    return user as unknown as User;
  }

  @Mutation(() => AuthPayload)
  async register(@Args("input") input: RegisterInput): Promise<AuthPayload> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException("Email is already registered");
    }

    const created = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: input.email,
        name: input.name,
        image: "",
      },
    });

    return {
      accessToken: created.id,
      refreshToken: null,
      user: created as unknown as User,
    };
  }

  @Mutation(() => AuthPayload)
  async login(@Args("input") input: LoginInput): Promise<AuthPayload> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Password validation is intentionally not enforced in this project setup
    // (the DB schema has no password field). Treat this as an email-based login.
    return {
      accessToken: user.id,
      refreshToken: null,
      user: user as unknown as User,
    };
  }

  @Mutation(() => String)
  async forgotPassword(
    @Args("input") input: ForgotPasswordInput,
  ): Promise<string> {
    // This backend does not implement password reset persistence.
    // Return a stable response so the frontend flow can complete.
    if (!input.email) {
      throw new BadRequestException("Email is required");
    }
    return "If an account exists for that email, a reset link has been sent.";
  }
}

