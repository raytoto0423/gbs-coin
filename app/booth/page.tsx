// app/booths/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import BoothDashboard from "./BoothDashboard";

export default async function BoothPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "BOOTH") {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>부스 계정으로만 접근할 수 있습니다.</p>
            </main>
        );
    }

    const boothId = session.user.boothId ?? session.user.id;

    // 🔹 현재 부스 정보(잔액 포함)
    const booth = await prisma.booth.findUnique({
        where: { id: boothId },
        select: {
            id: true,
            name: true,
            balance: true,
        },
    });

    // 🔹 전체 부스의 잔액 기준 순위 계산
    const allBooths = await prisma.booth.findMany({
        orderBy: { balance: "desc" },
        select: { id: true },
    });

    let rank: number | null = null;
    if (allBooths.length > 0) {
        const idx = allBooths.findIndex((b) => b.id === boothId);
        if (idx !== -1) {
            rank = idx + 1;
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <BoothDashboard
                boothId={boothId}
                boothBalance={booth?.balance ?? 0}
                rank={rank}
            />
        </main>
    );
}
