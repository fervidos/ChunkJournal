-- Add thumbnailS3Key column
ALTER TABLE "Screenshot" ADD COLUMN "thumbnailS3Key" TEXT;

-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS "Screenshot_worldId_idx" ON "Screenshot"("worldId");
CREATE INDEX IF NOT EXISTS "Screenshot_date_idx" ON "Screenshot"("date");
