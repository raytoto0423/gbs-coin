// app/user/scan/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserScanPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const scannedRef = useRef(false);
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        let isCancelled = false;

        const startScanner = async () => {
            try {
                const { Html5QrcodeScanner } = await import("html5-qrcode");

                const config = {
                    fps: 10,
                    qrbox: {
                        width: 250,
                        height: 250,
                    },
                };

                scannerRef.current = new Html5QrcodeScanner(
                    "qr-reader",
                    config,
                    false
                );

                const onScanSuccess = (decodedText: string) => {
                    if (scannedRef.current) return;
                    scannedRef.current = true;

                    scannerRef.current
                        ?.clear()
                        .catch(() => {})
                        .finally(() => {
                            handleDecoded(decodedText);
                        });
                };

                const onScanError = (_err: any) => {
                    // 콘솔에만 찍고 UI는 조용히 유지
                    // console.warn(_err);
                };

                scannerRef.current.render(onScanSuccess, onScanError);
            } catch (e) {
                console.error(e);
                if (!isCancelled) {
                    setError("QR 스캐너를 초기화할 수 없습니다.");
                }
            }
        };

        const handleDecoded = (value: string) => {
            try {
                let activityId: string | null = null;

                if (value.startsWith("http://") || value.startsWith("https://")) {
                    const url = new URL(value);
                    activityId = url.searchParams.get("activity");
                } else {
                    // 혹시 QR에 activity id만 들어간 형태라면
                    activityId = value;
                }

                if (!activityId) {
                    setError("QR 코드 형식이 올바르지 않습니다.");
                    scannedRef.current = false;
                    return;
                }

                router.push(`/user/pay?activity=${activityId}`);
            } catch (e) {
                console.error(e);
                setError("QR 코드 해석 중 오류가 발생했습니다.");
                scannedRef.current = false;
            }
        };

        startScanner();

        return () => {
            isCancelled = true;
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
            }
        };
    }, [router]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">QR 스캔해서 결제하기</h1>
                    <Link
                        href="/user"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        ← 내 정보로 돌아가기
                    </Link>
                </div>

                <p className="text-sm text-gray-600">
                    부스에서 보여주는 QR 코드를 사각형 안에 맞춰주세요. 인식되면 자동으로
                    결제 화면으로 이동합니다.
                </p>

                {error && (
                    <p className="text-sm text-red-600 border border-red-200 rounded-md p-2">
                        {error}
                    </p>
                )}

                <div
                    id="qr-reader"
                    className="w-full aspect-square rounded-xl border bg-black overflow-hidden"
                />
            </div>
        </main>
    );
}
