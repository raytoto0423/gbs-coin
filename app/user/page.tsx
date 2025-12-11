import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";
import ClassPresidentPanel from "./ClassPresidentPanel";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export default async function UserPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login/user");
    }

    const userId = session.user.id;
    const email = session.user.email ?? "";

    // 유저 조회
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

    // 유저 없으면 자동 생성
    if (!user) {
        user = await prisma.user.create({
            data: {
                id: userId,
                email,
                name: session.user.name ?? "",
                role: email === ADMIN_EMAIL ? "ADMIN" : "STUDENT",
                balance: 0,
            },
        });
    }

    const isAdminAccount = user.email === ADMIN_EMAIL;
    const grade = user.grade;
    const classRoom = user.classRoom;
    const classRole = user.classRole;

    const isClassPresident = classRole === "회장";
    const isVicePresident = classRole === "부회장";

    // 관리자 계정이면 접근 불가 안내
    if (isAdminAccount) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-4 space-y-4">
                <h1 className="text-2xl font-bold text-gray-50">관리자 계정입니다.</h1>
                <p className="text-sm text-gray-300 text-center">
                    관리자는 결제 기능을 사용할 수 없습니다.
                    <br />관리자 페이지를 이용해 주세요.
                </p>

                <div className="flex gap-3">
                    <Link
                        href="/admin"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                    >
                        관리자 페이지로 이동
                    </Link>
                    <LogoutButton />
                </div>

                <a
                    href="https://festival2-final.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
                >
                    <span>🎪</span>
                    축제 메인 페이지 바로가기
                </a>
            </main>
        );
    }

    // 최근 거래내역
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [{ fromUserId: user.id }, { toUserId: user.id }],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return (
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-50 text-stroke-gray-900">
                        {user.name}님 환영합니다.
                    </h1>

                    <p className="text-gray-400 text-sm">{user.email}</p>

                    {/* 학급 정보 + 회장/부회장 뱃지 */}
                    {grade && classRoom && (
                        <p className="text-sm text-gray-200 mt-1">
                            {grade}학년 {classRoom}반{" "}
                            {classRole && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                                    {classRole}
                                </span>
                            )}
                        </p>
                    )}
                </div>

                <LogoutButton />
            </div>

            {/* 회장 전용 패널 */}
            {isClassPresident && grade && classRoom && (
                <ClassPresidentPanel grade={grade} classRoom={classRoom} />
            )}

            {/* 잔액 + QR 결제 + 부스 순위 확인하기 */}
            <section className="p-4 border rounded-lg bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">보유 코인</h2>
                        <p className="text-3xl font-bold text-blue-600">
                            {user.balance.toLocaleString()} C
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <Link
                            href="/user/scan"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                            QR 스캔하여 결제하기
                        </Link>

                        {/* 🔥 부스 순위 확인하기 버튼 */}
                        <Link
                            href="/ranking"
                            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-xs"
                        >
                            부스 순위 확인하기
                        </Link>
                    </div>
                </div>
            </section>

            {/* 최근 거래내역 */}
            <section>
                <h2 className="text-lg font-semibold mb-3 text-gray-50 text-stroke-gray-900">
                    최근 거래 내역
                </h2>

                {transactions.length === 0 ? (
                    <p className="text-gray-400 text-sm">최근 거래 내역이 없습니다.</p>
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

            {/* 하단: 축제 페이지 + 문의하기 */}
            <section className="pt-2 space-y-2">
                <a
                    href="https://festival2-final.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
                >
                    <span>🎪</span>
                    축제 메인 페이지 바로가기
                </a>

                <Link
                    href="/user/inquiry"
                    className="block w-full px-4 py-2 text-center text-sm text-white bg-gray-700 rounded-md hover:bg-gray-600"
                >
                    관리자에게 문의하기
                </Link>
            </section>
        </main>
    );
}
