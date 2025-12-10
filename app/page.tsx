// app/user/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export default async function UserPage() {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p className="text-gray-900">로그인 후 이용할 수 있습니다.</p>
            </main>
        );
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
            classRole: true, // "학생" | "회장" | "부회장"
        },
    });

    // 🔥 2) 없으면 자동 생성 (최초 접속 시)
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

    // 🔥 3) 거래 내역
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

    // 학급 정보 텍스트
    const hasClassInfo = user.grade != null && user.classRoom != null;
    const classLabel = hasClassInfo
        ? `${user.grade}학년 ${user.classRoom}반`
        : null;
    const isClassPresident = user.classRole === "회장";
    const isVicePresident = user.classRole === "부회장";

    // 🔐 관리자 계정은 여기서 지갑 기능 사용 불가
    if (isAdminAccount) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-4 space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    관리자 계정입니다.
                </h1>
                <p className="text-sm text-gray-700 text-center">
                    관리자는 학생/선생님처럼 코인을 보유하거나 결제할 수 없습니다.
                    <br />
                    관리자 페이지를 사용해 주세요.
                </p>
                <div className="flex gap-3">
                    <Link
                        href="/admin"
                        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        관리자 페이지로 이동
                    </Link>
                    <LogoutButton />
                </div>
            </main>
        );
    }

    // 🔽 여기부터는 일반 학생/선생님 지갑 화면
    return (
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-50">
                        {user.name}님 환영합니다.
                    </h1>
                    <p className="text-gray-400 text-sm">{user.email}</p>

                    {/* 학년/반/역할 표시 */}
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

                {/* 상단 오른쪽 로그아웃 버튼 */}
                <LogoutButton />
            </div>

            {/* 회장 전용 안내 카드 */}
            {isClassPresident && hasClassInfo && (
                <section className="p-4 border rounded-lg bg-blue-50 text-sm text-gray-900 space-y-1">
                    <p className="font-semibold">
                        ✅ {classLabel} 회장 계정으로 로그인 중입니다.
                    </p>
                    <p>
                        이 계정은 본인 반 부스의 비밀번호를 변경할 수 있습니다.
                        <br />
                        (부스 로그인 페이지에서 ID:{" "}
                        <span className="font-mono">
                            {user.grade}-{user.classRoom}
                        </span>
                        , 초기 비번: <span className="font-mono">1234</span> 또는
                        변경한 비밀번호 사용)
                    </p>
                    <p className="text-xs text-gray-600">
                        추후에 여기에서 직접 부스 비밀번호를 변경하는 기능도
                        붙일 수 있습니다. (예: 새 비밀번호 입력 → 저장)
                    </p>
                </section>
            )}

            {/* 잔액 카드 */}
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

                    <div className="flex flex-col items-end gap-2">
                        <Link
                            href="/user/scan"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                            QR 스캔하여 결제하기
                        </Link>
                    </div>
                </div>
            </section>

            {/* 최근 거래 내역 */}
            <section>
                <h2 className="text-lg font-semibold mb-3 text-gray-50">
                    최근 거래 내역
                </h2>

                {transactions.length === 0 ? (
                    <p className="text-gray-600 text-sm">
                        최근 거래 내역이 없습니다.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((t) => {
                            const isIncoming = t.toUserId === user.id; // 내가 받은 돈?
                            const amountSigned = isIncoming
                                ? t.amount
                                : -t.amount;
                            const amountText =
                                (amountSigned > 0 ? "+" : "") +
                                amountSigned +
                                " C";
                            const color =
                                amountSigned > 0
                                    ? "text-green-600"
                                    : "text-red-600";

                            return (
                                <div
                                    key={t.id}
                                    className="p-3 border rounded-md bg-white shadow-sm"
                                >
                                    <p className="text-sm font-medium text-gray-900">
                                        {t.title ?? "거래"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(
                                            t.createdAt
                                        ).toLocaleString("ko-KR", {
                                            timeZone: "Asia/Seoul",
                                        })}
                                    </p>

                                    <p
                                        className={`mt-1 text-lg font-bold ${color}`}
                                    >
                                        {amountText}
                                    </p>

                                    {/* 상대 정보 표시 */}
                                    {t.toBooth && (
                                        <p className="text-xs text-gray-600">
                                            부스: {t.toBooth.name}
                                        </p>
                                    )}
                                    {!t.toBooth &&
                                        isIncoming &&
                                        t.fromUser && (
                                            <p className="text-xs text-gray-600">
                                                보낸 사람:{" "}
                                                {t.fromUser.name ??
                                                    t.fromUser.email}
                                            </p>
                                        )}
                                    {!t.toBooth &&
                                        !isIncoming &&
                                        t.toUser && (
                                            <p className="text-xs text-gray-600">
                                                받은 사람:{" "}
                                                {t.toUser.name ??
                                                    t.toUser.email}
                                            </p>
                                        )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
