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
            <main className="min-h-screen flex items-center justify-center px-4 text-gray-900 dark:text-gray-100">
                <div className="card max-w-md w-full p-6 rounded-lg border shadow-sm text-center space-y-2">
                    <h1 className="text-lg font-bold">로그인이 필요합니다.</h1>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-mono text-xs">/login/user</span> 에서 로그인해 주세요.
                    </p>
                </div>
            </main>
        );
    }

    if (session.user.role === "BOOTH") {
        return (
            <main className="min-h-screen flex items-center justify-center px-4 text-gray-900 dark:text-gray-100">
                <div className="card max-w-md w-full p-6 rounded-lg border shadow-sm text-center space-y-2">
                    <h1 className="text-lg font-bold">접근 불가</h1>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        부스 계정은 결제 페이지에 접근할 수 없습니다.
                    </p>
                </div>
            </main>
        );
    }

    const { activity: activityId } = await searchParams;

    if (!activityId) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4 text-gray-900 dark:text-gray-100">
                <div className="card max-w-md w-full p-6 rounded-lg border shadow-sm text-center space-y-2">
                    <h1 className="text-lg font-bold">활동 정보가 없습니다.</h1>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        QR 코드가 잘못되었을 수 있습니다. 다시 시도해 주세요.
                    </p>
                </div>
            </main>
        );
    }

    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: { booth: true },
    });

    if (!activity || !activity.booth) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4 text-gray-900 dark:text-gray-100">
                <div className="card max-w-md w-full p-6 rounded-lg border shadow-sm text-center space-y-2">
                    <h1 className="text-lg font-bold">활동을 찾을 수 없습니다.</h1>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        QR 코드가 만료되었거나 잘못된 링크일 수 있습니다.
                    </p>
                </div>
            </main>
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    const userBalance = user?.balance ?? 0;

    return (
        <main className="min-h-screen flex items-center justify-center px-4 text-gray-900 dark:text-gray-100">
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
