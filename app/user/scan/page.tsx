// app/user/scan/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import Link from "next/link";

export default function UserScanPage() {
    const qrRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const hasScanned = useRef(false); // 🔥 중복 인식 방지용

    useEffect(() => {
        const startScanner = async () => {
            try {
                if (hasScanned.current) return;

                setScanning(true);

                const html5Qr = new Html5Qrcode("qr-reader", {
                    verbose: false,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                });
                qrRef.current = html5Qr;

                await html5Qr.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },

                    // 🔥 QR 인식 콜백
                    async (decodedText) => {
                        if (hasScanned.current) return; // 중복 방지
                        hasScanned.current = true;

                        // 🔴 QR 인식 즉시 카메라 종료
                        await html5Qr.stop().catch(() => {});
                        qrRef.current = null;

                        // 🔴 이후 redirect
                        window.location.href = `/user/pay?activity=${decodedText}`;
                    },

                    () => {}
                );
            } catch (e) {
                setError("카메라를 사용할 수 없습니다. 권한을 허용해주세요.");
                console.error(e);
            }
        };

        startScanner();

        return () => {
            if (qrRef.current) {
                qrRef.current.stop().catch(() => {});
            }
        };
    }, []);

    return (
        <main className="min-h-screen px-4 py-6 space-y-6">
            <h1 className="text-2xl font-bold">QR 스캔하여 결제하기</h1>

            {error && <p className="text-red-600">{error}</p>}

            <div
                id="qr-reader"
                className="w-full max-w-sm mx-auto border rounded-lg overflow-hidden"
                style={{ minHeight: 300 }}
            />

            <Link
                href="/user"
                className="inline-block mt-4 px-4 py-2 border rounded-md hover:bg-gray-100"
            >
                ← 내 정보로 돌아가기
            </Link>
        </main>
    );
}
