BEGIN;

-- Add role column to User table if it doesn't exist (safe, non-destructive)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" text;

-- Create TeacherProfile table if it doesn't exist
CREATE TABLE IF NOT EXISTS "TeacherProfile" (
  id text PRIMARY KEY,
  "userId" text UNIQUE NOT NULL,
  bio text,
  degree text,
  "experienceYears" integer,
  subjects jsonb,
  skills jsonb,
  linkedin text,
  "profileImageUrl" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_user
    FOREIGN KEY("userId")
    REFERENCES "User"(id)
    ON DELETE CASCADE
);

COMMIT;
