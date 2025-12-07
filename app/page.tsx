// app/page.tsx
import Link from "next/link";

export default function HomePage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md space-y-4 text-center">
                <h1 className="text-3xl font-bold mb-2">GBS 축제 코인 시스템</h1>
                <p className="text-gray-600 mb-4">
                    아래에서 로그인 유형을 선택하세요.
                </p>

                <div className="space-y-2">
                    <Link
                        href="/login/user"
                        className="block w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700"
                    >
                        학생/선생님 로그인
                    </Link>
                    <Link
                        href="/login/booth"
                        className="block w-full py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                    >
                        반 부스 로그인
                    </Link>
                </div>
            </div>
        </main>
    );
}
