// app/booth/page.tsx
import { auth } from "@/auth";
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

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <BoothDashboard boothId={boothId} />
        </main>
    );
}
