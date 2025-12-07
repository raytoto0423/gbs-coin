// app/user/scan/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserScanPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const qrRef = useRef<any>(null);
    const handledOnceRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const handleDecoded = (value: string) => {
            if (handledOnceRef.current) return;
            handledOnceRef.current = true;

            try {
                let activityId: string | null = null;

                if (value.startsWith("http://") || value.startsWith("https://")) {
                    const url = new URL(value);
                    activityId = url.searchParams.get("activity");
                } else {
                    // 혹시 activity id만 들어있는 QR일 경우
                    activityId = value;
                }

                if (!activityId) {
                    setError("QR 코드 형식이 올바르지 않습니다.");
                    handledOnceRef.current = false;
                    return;
                }

                router.push(`/user/pay?activity=${activityId}`);
            } catch (e) {
                console.error(e);
                setError("QR 코드 해석 중 오류가 발생했습니다.");
                handledOnceRef.current = false;
            }
        };

        const startScanner = async () => {
            try {
                const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
                    "html5-qrcode"
                    );

                if (cancelled) return;

                // div#qr-reader 안에 카메라 프리뷰만 띄우는 방식
                const html5Qr = new Html5Qrcode("qr-reader", {
                    verbose: false,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                });
                qrRef.current = html5Qr;

                // 사용 가능한 카메라 목록 가져오기
                const cameras = await Html5Qrcode.getCameras();
                if (!cameras || cameras.length === 0) {
                    setError("사용 가능한 카메라를 찾을 수 없습니다.");
                    return;
                }

                // 가능한 경우 후면 카메라 우선 선택
                const backCamera =
                    cameras.find((c) =>
                        /back|후면|environment/i.test(c.label || "")
                    ) ?? cameras[0];

                await html5Qr.start(
                    backCamera.id,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText: string) => {
                        if (cancelled) return;
                        handleDecoded(decodedText);
                    },
                    () => {
                        // 스캔 실패 콜백은 무시 (계속 시도)
                    }
                );

                if (!cancelled) setIsStarting(false);
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setError(
                        "카메라를 시작할 수 없습니다. 브라우저 권한을 확인해 주세요."
                    );
                }
            }
        };

        startScanner();

        return () => {
            cancelled = true;
            if (qrRef.current) {
                qrRef.current
                    .stop()
                    .catch(() => {})
                    .finally(() => {
                        qrRef.current?.clear().catch(() => {});
                    });
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

                {isStarting && !error && (
                    <p className="text-sm text-gray-500">
                        카메라를 준비하는 중입니다. 브라우저에서 카메라 권한을 허용해 주세요.
                    </p>
                )}

                {/* 🔥 이 영역 안에 html5-qrcode가 카메라 프리뷰를 직접 그려줌 */}
                <div
                    id="qr-reader"
                    className="w-full aspect-square rounded-xl border bg-black overflow-hidden"
                />
            </div>
        </main>
    );
}
