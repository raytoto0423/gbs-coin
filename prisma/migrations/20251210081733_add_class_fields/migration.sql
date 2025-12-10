-- AlterTable
ALTER TABLE "Booth" ADD COLUMN     "classRoom" INTEGER,
ADD COLUMN     "grade" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "classRole" TEXT,
ADD COLUMN     "classRoom" INTEGER,
ADD COLUMN     "grade" INTEGER,
ADD COLUMN     "number" INTEGER;
