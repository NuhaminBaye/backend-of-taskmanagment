import { Request } from "express";

export function extractUserIdFromRequest(req: Request): string | undefined {
  const headerUserId =
    (req.headers["x-user-id"] as string | undefined) ||
    (req.headers["x-userid"] as string | undefined);

  if (headerUserId) {
    return headerUserId.trim();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    // Ignore JWT-like bearer tokens in no-auth mode; only allow raw user-id formats.
    const looksLikeJwt = token.includes(".");
    const looksLikeUserId =
      token.startsWith("user_") ||
      token.startsWith("local-") ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        token,
      );

    if (token && !looksLikeJwt && looksLikeUserId) {
      return token;
    }
  }

  const envUserId = process.env.DEFAULT_USER_ID?.trim();
  if (envUserId) {
    return envUserId;
  }

  return undefined;
}
