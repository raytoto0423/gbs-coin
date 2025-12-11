// app/user/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export default async function UserPage() {
    const session = await auth();

    // 🔥 변경된 부분: 로그인 안 되어 있으면 자동 리디렉션
    if (!session?.user) {
        redirect("/login/user");
    }

    const userId = session.user.id;
    const email = session.user.email ?? "";
    const name = session.user.name ?? "";

    // 🔥 1) 유저 조회 (학년/반/역할까지 같이 가져오기)
    let user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            balance: true,
            role: true,
            email: true,
            grade: true,
            classRoom: true,
            classRole: true,
        },
    });

    // 🔥 2) 없으면 DB 자동 생성
    if (!user) {
        user = await prisma.user.create({
            data: {
                id: userId,
                email,
                name,
                role: email === ADMIN_EMAIL ? "ADMIN" : "STUDENT",
                balance: 0,
            },
            select: {
                id: true,
                name: true,
                balance: true,
                role: true,
                email: true,
                grade: true,
                classRoom: true,
                classRole: true,
            },
        });
    }

    // 🔥 3) 거래 내역 (최근 10개)
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [{ fromUserId: user.id }, { toUserId: user.id }],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
            fromUser: true,
            toUser: true,
            toBooth: true,
        },
    });

    const isAdminAccount = user.email === ADMIN_EMAIL;

    // 학급 정보
    const hasClassInfo = user.grade != null && user.classRoom != null;
    const classLabel = hasClassInfo
        ? `${user.grade}학년 ${user.classRoom}반`
        : null;

    const isClassPresident = user.classRole === "회장";
    const isVicePresident = user.classRole === "부회장";

    // 🔐 관리자 계정 → 학생 화면 접근 시 안내
    if (isAdminAccount) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-4 space-y-4">
                <h1 className="text-2xl font-bold text-gray-50">
                    관리자 계정입니다.
                </h1>
                <p className="text-sm text-gray-700 text-center">
                    관리자는 학생처럼 결제 기능을 사용할 수 없습니다.
                    <br />
                    관리자 페이지를 이용해 주세요.
                </p>

                <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-3">
                        <Link
                            href="/admin"
                            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                        >
                            관리자 페이지로 이동
                        </Link>
                        <LogoutButton />
                    </div>

                    {/* 🎪 관리자 화면에서도 축제 메인 페이지 버튼 제공 */}
                    <a
                        href="https://festival2-final.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
                    >
                        <span>🎪</span>
                        <span>축제 메인 페이지 바로가기</span>
                    </a>
                </div>
            </main>
        );
    }

    // 🔽 여기부터 학생/선생님 지갑 화면
    return (
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-50 text-stroke-gray-900">
                        {user.name}님 환영합니다.
                    </h1>
                    <p className="text-gray-400 text-sm">{user.email}</p>

                    {/* 학년/반/역할 */}
                    {hasClassInfo && (
                        <p className="text-xs text-gray-300">
                            {classLabel}{" "}
                            {isClassPresident
                                ? "(회장)"
                                : isVicePresident
                                    ? "(부회장)"
                                    : "(학생)"}
                        </p>
                    )}
                </div>

                <LogoutButton />
            </div>

            {/* ✅ 회장 전용 안내 + 부스 비밀번호 변경 버튼 */}
            {isClassPresident && hasClassInfo && (
                <section className="p-4 border rounded-lg bg-blue-50 text-sm text-gray-900 space-y-3">
                    <div className="space-y-1">
                        <p className="font-semibold">
                            ✅ {classLabel} 회장 계정으로 로그인 중입니다.
                        </p>
                        <p>
                            본인 반 부스의 비밀번호를 변경할 수 있습니다.
                            <br />
                            (부스 로그인 ID:{" "}
                            <span className="font-mono">
                                {user.grade}-{user.classRoom}
                            </span>
                            )
                        </p>
                    </div>

                    {/* 🔥 여기서 실제 비밀번호 변경 페이지로 이동 */}
                    <Link
                        href="/booths/change-password" // 필요하면 이 경로만 바꿔줘
                        className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                    >
                        부스 비밀번호 변경하기
                    </Link>
                </section>
            )}

            {/* 잔액 */}
            <section className="p-4 border rounded-lg shadow-sm bg-white space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            보유 코인
                        </h2>
                        <p className="text-3xl font-bold text-blue-600">
                            {user.balance.toLocaleString()} C
                        </p>
                    </div>

                    <Link
                        href="/user/scan"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                        QR 스캔하여 결제하기
                    </Link>
                </div>
            </section>

            {/* 최근 거래내역 */}
            <section>
                <h2 className="text-lg font-semibold mb-3 text-gray-50 text-stroke-gray-900">
                    최근 거래 내역
                </h2>

                {transactions.length === 0 ? (
                    <p className="text-gray-600 text-sm">
                        최근 거래 내역이 없습니다.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((t) => {
                            const isIncoming = t.toUserId === user.id;
                            const amountSigned = isIncoming ? t.amount : -t.amount;

                            return (
                                <div
                                    key={t.id}
                                    className="p-3 border rounded-md bg-white shadow-sm"
                                >
                                    <p className="text-sm font-medium text-gray-900">
                                        {t.title ?? "거래"}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        {new Date(t.createdAt).toLocaleString("ko-KR")}
                                    </p>

                                    <p
                                        className={`mt-1 text-lg font-bold ${
                                            amountSigned > 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {amountSigned > 0
                                            ? `+${amountSigned} C`
                                            : `${amountSigned} C`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* 🎪 축제 메인 페이지 바로가기 버튼 (학생/선생님 화면 맨 아래) */}
            <section className="pt-2">
                <a
                    href="https://festival2-final.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
                >
                    <span>🎪</span>
                    <span>축제 메인 페이지 바로가기</span>
                </a>
            </section>
        </main>
    );
}
