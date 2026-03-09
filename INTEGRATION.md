# Flutter + NestJS Integration

This backend is designed to work with the **task_management_flutter** app.

## 1. Backend (this folder)

```bash
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL (PostgreSQL), PORT=5000
npx prisma generate
npx prisma db push   # or: npx prisma migrate deploy
npm run start:dev
```

- GraphQL endpoint: **http://localhost:5000/graphql**
- Auth: Login/Register return `accessToken` (user ID). The Flutter app sends it as `Authorization: Bearer <accessToken>`.

## 2. Flutter app (task_management_flutter)

In the Flutter project root, ensure `.env` contains:

```
GRAPHQL_HTTP_ENDPOINT=http://localhost:5000/graphql
GRAPHQL_WS_ENDPOINT=ws://localhost:5000/graphql
```

- For **Chrome/desktop**: `localhost` is correct.
- For **Android emulator**: The app rewrites `localhost` to `10.0.2.2` automatically.

Then run:

```bash
flutter pub get
flutter run -d chrome
```

## 3. Flow

1. User opens app → lands on Login (or Dashboard if already logged in).
2. After **Login** or **Register**, the app stores `accessToken` (UUID) and sends it on every GraphQL request.
3. **Create project**: App calls `workspaces` then `createProject` (needs workspace + current user email as team_lead). If the user has no workspace, the backend auto-creates one on first `workspaces` query (when using fallback user) or the user can create a **Team** first (which creates a workspace).
4. **Create task**: Requires projectId, title, due_date; optional description, priority, assigneeId.

## 4. Troubleshooting

| Issue | Check |
|-------|--------|
| Timeout / No response | Backend running? `curl http://localhost:5000/graphql` (POST with a simple query). Same PORT in .env as Flutter? |
| Unauthorized | Login first. Token is sent as `Authorization: Bearer <user-id>`. |
| CORS error (web) | Backend allows `http://localhost:*`. If Flutter runs on another origin, set FRONTEND_URL in server .env. |
| "No workspace available" | Create a **Team** in the app first (creates a workspace), then create projects. |
