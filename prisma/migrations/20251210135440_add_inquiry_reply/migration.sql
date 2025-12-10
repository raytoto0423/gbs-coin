-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "repliedByEmail" TEXT,
ADD COLUMN     "replyMessage" TEXT;
