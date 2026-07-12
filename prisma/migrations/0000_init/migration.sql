CREATE TABLE "World" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Screenshot" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filename" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "mimeType" TEXT NOT NULL DEFAULT 'image/png',
    "s3Key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldId" TEXT,

    CONSTRAINT "Screenshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScreenshotTag" (
    "screenshotId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ScreenshotTag_pkey" PRIMARY KEY ("screenshotId","tagId")
);

CREATE UNIQUE INDEX "World_name_key" ON "World"("name");
CREATE UNIQUE INDEX "World_slug_key" ON "World"("slug");
CREATE UNIQUE INDEX "Screenshot_s3Key_key" ON "Screenshot"("s3Key");
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

ALTER TABLE "Screenshot" ADD CONSTRAINT "Screenshot_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScreenshotTag" ADD CONSTRAINT "ScreenshotTag_screenshotId_fkey" FOREIGN KEY ("screenshotId") REFERENCES "Screenshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScreenshotTag" ADD CONSTRAINT "ScreenshotTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
