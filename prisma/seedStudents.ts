// prisma/seedStudents.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(__dirname, "data", "2025_students_final_v3.csv");
    const text = fs.readFileSync(filePath, "utf8").trim();

    const lines = text.split(/\r?\n/);
    const header = lines.shift()!.split(",");

    const idx = {
        grade: header.indexOf("grade"),
        klass: header.indexOf("class"),
        number: header.indexOf("number"),
        name: header.indexOf("name"),
        role: header.indexOf("role"),
        email: header.indexOf("email"),
    };

    if (Object.values(idx).some((i) => i === -1)) {
        throw new Error("CSV 헤더가 예상과 다릅니다.");
    }

    // 학생 계정만 싹 지우고 다시 넣기 (선생/관리자는 유지)
    await prisma.user.deleteMany({
        where: { role: "STUDENT" },
    });

    for (const line of lines) {
        if (!line.trim()) continue;
        const cols = line.split(",");

        const grade = Number(cols[idx.grade]);
        const classRoom = Number(cols[idx.klass]);
        const number = Number(cols[idx.number]);
        const name = cols[idx.name];
        const classRole = cols[idx.role]; // "학생" | "회장" | "부회장"
        const email = cols[idx.email];

        await prisma.user.upsert({
            where: { email },
            update: {
                name,
                role: "STUDENT",
                grade,
                classRoom,
                number,
                classRole,
                // balance는 그대로 둠 (이미 있으면 유지)
            },
            create: {
                email,
                name,
                role: "STUDENT",
                balance: 0,
                grade,
                classRoom,
                number,
                classRole,
            },
        });
    }

    console.log("학생 계정 seed 완료 ✅");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
