// app/booth/qr/[id]/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export default async function QRPage({
                                         params,
                                     }: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();

    if (!session?.user || session.user.role !== "BOOTH") {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>부스 계정으로만 접근할 수 있습니다.</p>
            </main>
        );
    }

    // 🔥 여기 중요: params를 await 해서 id 꺼내기
    const { id: activityId } = await params;

    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
    });

    if (!activity) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>활동을 찾을 수 없습니다.</p>
            </main>
        );
    }

    // .env에 NEXTAUTH_URL이 꼭 있어야 함 (예: http://localhost:3000)
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const paymentUrl = `${baseUrl}/user/pay?activity=${activity.id}`;

    const qrDataUrl = await QRCode.toDataURL(paymentUrl);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6">
            <h1 className="text-2xl font-bold">{activity.title} QR 코드</h1>

            <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />

            <p className="text-gray-500 text-sm">
                가격: {activity.price} 코인 · 타입: {activity.type}
            </p>

            <p className="text-xs text-gray-400 break-all text-center">
                스캔 시 이동: {paymentUrl}
            </p>
        </main>
    );
}
