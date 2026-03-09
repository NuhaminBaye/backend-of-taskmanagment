-- Example SQL to manually insert a user into the database
-- Note: The 'id' should be a unique string (typically Clerk user ID format)
-- If you're not using Clerk for this user, use any unique string format

-- Example 1: Basic user with minimal data
INSERT INTO "User" (id, name, email, image, "createdAt", "updatedAt")
VALUES (
  'user_natamnatamt_001',  -- Unique ID (use any format you want)
  'Natam Natamt',          -- Full name
  'natamnatamt@gmail.com', -- Email (must be unique)
  'https://example.com/avatar.jpg', -- Profile image URL (or empty string '')
  NOW(),                   -- Current timestamp
  NOW()                    -- Current timestamp
);

-- Example 2: User with empty image
INSERT INTO "User" (id, name, email, image, "createdAt", "updatedAt")
VALUES (
  'user_test_002',
  'Test User',
  'test@example.com',
  '',  -- Empty image
  NOW(),
  NOW()
);

-- Example 3: User with Clerk-like ID format
INSERT INTO "User" (id, name, email, image, "createdAt", "updatedAt")
VALUES (
  'user_2abc123def456',  -- Clerk-like ID format
  'John Doe',
  'john.doe@example.com',
  'https://img.clerk.com/preview.png',
  NOW(),
  NOW()
);



