// app/user/pay/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PayClient from "./PayClient";

export default async function UserPayPage({
                                              searchParams,
                                          }: {
    searchParams: Promise<{ activity?: string }>;
}) {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>로그인이 필요합니다. /login/user 에서 로그인해 주세요.</p>
            </main>
        );
    }

    if (session.user.role === "BOOTH") {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>부스 계정은 결제 페이지에 접근할 수 없습니다.</p>
            </main>
        );
    }

    const { activity: activityId } = await searchParams;

    if (!activityId) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>활동 정보가 없습니다. QR 코드가 잘못되었을 수 있습니다.</p>
            </main>
        );
    }

    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: { booth: true },
    });

    if (!activity || !activity.booth) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>해당 활동을 찾을 수 없습니다.</p>
            </main>
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    const userBalance = user?.balance ?? 0;

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <PayClient
                activityId={activity.id}
                activityTitle={activity.title}
                price={activity.price}
                type={activity.type}
                boothName={activity.booth.name}
                userBalance={userBalance}
            />
        </main>
    );
}
