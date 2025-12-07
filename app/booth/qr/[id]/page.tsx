// app/booth/qr/[id]/page.tsx
// @ts-nocheck   // 🔥 이 줄 추가

import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import Link from "next/link";

export default async function BoothQRPage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const activity = await prisma.activity.findUnique({
        where: { id },
        include: { booth: true },
    });

    if (!activity || !activity.booth) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>존재하지 않는 활동입니다.</p>
            </main>
        );
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const paymentUrl = `${baseUrl}/user/pay?activity=${activity.id}`;

    const qrDataUrl = await QRCode.toDataURL(paymentUrl);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
            {/* 제목/설명 */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">결제 QR 코드</h1>
                <p className="text-gray-600">
                    부스: {activity.booth.name}
                    <br />
                    상품: {activity.title} ({activity.price} C)
                </p>
            </div>

            {/* QR 이미지 */}
            <div className="bg-white p-4 rounded-xl shadow">
                <img
                    src={qrDataUrl}
                    alt="결제 QR 코드"
                    className="w-64 h-64"
                />
            </div>

            {/* ✅ 부스 화면으로 돌아가기 버튼 */}
            <Link
                href="/booth"
                className="mt-2 px-4 py-2 rounded-md border text-sm hover:bg-gray-100"
            >
                부스 화면으로 돌아가기
            </Link>
        </main>
    );
}
