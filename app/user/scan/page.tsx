// app/user/scan/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import Link from "next/link";

export default function UserScanPage() {
    const qrRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        const startScanner = async () => {
            try {
                setScanning(true);

                const html5Qr = new Html5Qrcode("qr-reader", {
                    verbose: false,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                });
                qrRef.current = html5Qr;

                await html5Qr.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        window.location.href = `/user/pay?activity=${decodedText}`;
                    },
                    () => {}
                );
            } catch (e) {
                setError("카메라를 사용할 수 없습니다. 권한을 허용해주세요.");
                console.error(e);
            } finally {
                setScanning(false);
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
        <main className="min-h-screen px-4 py-6 space-y-6 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                QR 스캔하여 결제하기
            </h1>

            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            <div
                id="qr-reader"
                className="card w-full max-w-sm mx-auto border rounded-lg overflow-hidden"
                style={{ minHeight: 300 }}
            />

            <div className="flex items-center justify-between max-w-sm mx-auto">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                    카메라가 켜지지 않으면, 브라우저에서 카메라 권한을 허용해 주세요.
                </span>
            </div>

            <Link
                href="/user"
                className="inline-block mt-4 px-4 py-2 border rounded-md text-sm border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
                ← 내 정보로 돌아가기
            </Link>
        </main>
    );
}
