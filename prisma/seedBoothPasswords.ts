// prisma/seedBoothPasswords.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const plain = "1234";
    const hash = await bcrypt.hash(plain, 10);

    // 모든 부스 비밀번호를 1234로 초기화
    await prisma.booth.updateMany({
        data: {
            passwordHash: hash,
            passwordPlain: plain,
        },
    });

    console.log("모든 부스 비밀번호를 1234로 초기화 완료 ✅");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
