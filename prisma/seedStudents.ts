// prisma/seedStudents.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();

// ES module 환경에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV 파일 경로
const CSV_PATH = path.join(__dirname, "2025_students_final_v3.csv");

type StudentRow = {
    grade: number;
    classRoom: number;
    number: number;
    name: string;
    email: string;
    classRole: string | null;
};

function parseCsv(): StudentRow[] {
    const raw = fs.readFileSync(CSV_PATH, "utf8");
    const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    if (lines.length === 0) {
        console.warn("CSV가 비어 있습니다.");
        return [];
    }

    // CSV 헤더
    const header = lines[0].split(",");
    const idx = (key: string) => header.indexOf(key);

    const gradeIdx = idx("grade");
    const classIdx = idx("class");
    const numberIdx = idx("number");
    const nameIdx = idx("name");
    const emailIdx = idx("email");
    const roleIdx = idx("role");

    if (
        [gradeIdx, classIdx, numberIdx, nameIdx, emailIdx, roleIdx].some(
            (i) => i === -1
        )
    ) {
        console.error("헤더:", header);
        throw new Error(
            "CSV 헤더가 (grade,class,number,name,role,email) 형식이 아닙니다."
        );
    }

    const rows: StudentRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length < header.length) continue;

        const grade = Number(cols[gradeIdx]);
        const classRoom = Number(cols[classIdx]);
        const number = Number(cols[numberIdx]);
        const name = cols[nameIdx].trim();
        const email = cols[emailIdx].trim();
        const roleRaw = cols[roleIdx]?.trim() ?? "";
        const classRole = roleRaw === "" ? null : roleRaw;

        if (!email) continue;

        rows.push({ grade, classRoom, number, name, email, classRole });
    }

    return rows;
}

async function main() {
    const students = parseCsv();
    console.log(`CSV에서 ${students.length}명 로드됨.`);

    for (const s of students) {
        const { email, name, grade, classRoom, number, classRole } = s;

        await prisma.user.upsert({
            where: { email },
            update: {
                name,
                grade,
                classRoom,
                number,
                classRole,
                role: "STUDENT",
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

    console.log("학생 정보 동기화 완료 ✅");
}

main()
    .catch((e) => {
        console.error("에러 발생:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
