# How to Manually Insert User Data

This guide shows you how to manually insert user data into the database.

## Method 1: Using Prisma Studio (Easiest - GUI)

1. Run Prisma Studio:
   ```bash
   cd server
   npx prisma studio
   ```
2. Open http://localhost:5555 in your browser
3. Click on "User" model
4. Click "Add record"
5. Fill in the fields:
   - **id**: `user_natamnatamt_001` (or any unique string)
   - **name**: `Natam Natamt`
   - **email**: `natamnatamt@gmail.com` (must be unique)
   - **image**: `https://example.com/avatar.jpg` (or leave empty `""`)
6. Click "Save 1 change"

## Method 2: Using SQL (Direct Database)

Use the SQL file `insert-user-example.sql`:

```sql
INSERT INTO "User" (id, name, email, image, "createdAt", "updatedAt")
VALUES (
  'user_natamnatamt_001',
  'Natam Natamt',
  'natamnatamt@gmail.com',
  'https://example.com/avatar.jpg',
  NOW(),
  NOW()
);
```

Run this in your database client (pgAdmin, DBeaver, etc.) or via psql:
```bash
psql $DATABASE_URL -f server/scripts/insert-user-example.sql
```

## Method 3: Using TypeScript Script

1. Make sure your `.env` file has `DATABASE_URL` set
2. Edit `server/scripts/insert-user.ts` with your user data
3. Run:
   ```bash
   cd server
   npx ts-node scripts/insert-user.ts
   ```

Or use tsx if you have it:
```bash
npx tsx server/scripts/insert-user.ts
```

## Example User Data

### For natamnatamt@gmail.com:
```json
{
  "id": "user_natamnatamt_001",
  "name": "Natam Natamt",
  "email": "natamnatamt@gmail.com",
  "image": "https://i.pravatar.cc/150?img=5"
}
```

### Minimal Example:
```json
{
  "id": "user_test_001",
  "name": "Test User",
  "email": "test@example.com",
  "image": ""
}
```

## Important Notes

⚠️ **ID Format**: The `id` field must be unique. If you're using Clerk authentication, use Clerk's user ID format (`user_xxxxx`). For manual users, you can use any unique string.

⚠️ **Email Uniqueness**: The `email` field must be unique. If you try to insert a duplicate email, you'll get an error.

⚠️ **Authentication**: If this user needs to authenticate via Clerk, make sure:
1. The user exists in Clerk with the same email
2. The `id` matches Clerk's user ID (format: `user_xxxxx`)

⚠️ **Image URL**: You can use:
- Empty string: `""`
- Full URL: `"https://example.com/avatar.jpg"`
- Placeholder: `"https://i.pravatar.cc/150?img=5"`

## Quick Copy-Paste SQL

```sql
-- Insert user: natamnatamt@gmail.com
INSERT INTO "User" (id, name, email, image, "createdAt", "updatedAt")
VALUES (
  'user_natamnatamt_001',
  'Natam Natamt',
  'natamnatamt@gmail.com',
  'https://i.pravatar.cc/150?img=5',
  NOW(),
  NOW()
);
```

## Troubleshooting

**Error: Email already exists**
- The email is already in the database. Change the email or delete the existing user first.

**Error: ID already exists**
- The ID is already in use. Change the ID to something unique.

**User not showing in app**
- If using Clerk, ensure the user ID matches Clerk's user ID
- Check that the email matches the Clerk account email



