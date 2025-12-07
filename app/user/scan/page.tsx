// app/user/scan/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserScanPage() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let stream: MediaStream | null = null;
        let intervalId: number | null = null;
        let canceled = false;

        const start = async () => {
            // 브라우저 지원 여부 확인
            const hasBarcodeDetector =
                typeof window !== "undefined" &&
                "BarcodeDetector" in window &&
                // @ts-ignore
                Array.isArray(window.BarcodeDetector.getSupportedFormats?.());

            if (!hasBarcodeDetector) {
                setError(
                    "이 브라우저에서는 QR 스캔을 지원하지 않습니다. 카메라 앱으로 QR을 찍으면 결제 페이지가 열립니다."
                );
                return;
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                });

                if (!videoRef.current) return;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                // @ts-ignore
                const detector = new window.BarcodeDetector({
                    formats: ["qr_code"],
                });

                intervalId = window.setInterval(async () => {
                    if (canceled) return;
                    if (!videoRef.current) return;

                    try {
                        // 비디오 프레임을 바로 감지 대상으로 사용
                        const barcodes = await detector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            const raw = barcodes[0].rawValue as string;
                            handleDetected(raw);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }, 700);
            } catch (e) {
                console.error(e);
                setError(
                    "카메라에 접근할 수 없습니다. 브라우저 권한을 확인하거나 카메라 앱으로 QR을 찍어 주세요."
                );
            }
        };

        const handleDetected = (value: string) => {
            if (scanning) return;
            setScanning(true);

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
                    setScanning(false);
                    return;
                }

                // 결제 페이지로 이동
                router.push(`/user/pay?activity=${activityId}`);
            } catch (e) {
                console.error(e);
                setError("QR 코드 해석 중 오류가 발생했습니다.");
                setScanning(false);
            }
        };

        start();

        return () => {
            canceled = true;
            if (intervalId !== null) window.clearInterval(intervalId);
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
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
                    부스에서 보여주는 QR 코드를 화면 중앙에 두고 잠시 기다리면 자동으로
                    결제 화면으로 이동합니다.
                </p>

                {/* 카메라 프리뷰 */}
                <div className="aspect-square w-full max-w-md bg-black rounded-xl overflow-hidden flex items-center justify-center">
                    {error ? (
                        <p className="text-sm text-red-500 p-4 text-center">{error}</p>
                    ) : (
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                        />
                    )}
                </div>

                <p className="text-xs text-gray-500">
                    일부 브라우저(특히 오래된 브라우저)에서는 QR 스캔을 지원하지 않을 수
                    있습니다. 이 경우 카메라 앱으로 QR을 찍으면 자동으로 결제 페이지가
                    열립니다.
                </p>
            </div>
        </main>
    );
}
