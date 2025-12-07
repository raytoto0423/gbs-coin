// app/booth/page.tsx
import { auth } from "@/auth";
import BoothDashboard from "./BoothDashboard";

export default async function BoothPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "BOOTH") {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <div className="card p-6 text-center space-y-2 max-w-md w-full">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        접근 불가
                    </h1>
                    <p className="text-gray-700 dark:text-gray-300">
                        부스 계정으로만 접근할 수 있습니다.
                    </p>
                </div>
            </main>
        );
    }

    const boothId = session.user.boothId ?? session.user.id;

    return (
        <main
            className="
                min-h-screen flex items-center justify-center px-4
                text-gray-900 dark:text-gray-100
            "
        >
            <BoothDashboard boothId={boothId} />
        </main>
    );
}
