// app/user/inquiry/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

type Props = {
    searchParams?: {
        sent?: string;
        error?: string;
    };
};

export default async function InquiryPage({ searchParams }: Props) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login/user");
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    if (!user) {
        redirect("/login/user");
    }

    const inquiries = await prisma.inquiry.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    const sent = searchParams?.sent === "1";
    const error = searchParams?.error === "1";

    return (
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
            {/* 상단 헤더 + 돌아가기 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-50">문의하기</h1>
                    <p className="text-xs text-gray-400">
                        {user.name} / {user.email}
                    </p>
                </div>

                <Link
                    href="/user"
                    className="px-3 py-1 rounded-md bg-gray-700 text-xs text-white hover:bg-gray-600"
                >
                    돌아가기
                </Link>
            </div>

            {/* ✅ 전송 성공 / 에러 메시지 */}
            {sent && (
                <div className="p-3 rounded-md bg-green-600 text-xs text-white">
                    문의가 정상적으로 전송되었습니다.
                </div>
            )}
            {error && (
                <div className="p-3 rounded-md bg-red-600 text-xs text-white">
                    문의 내용을 입력해 주세요.
                </div>
            )}

            {/* 문의 작성 폼 */}
            <section className="space-y-2 p-4 rounded-lg bg-white">
                <h2 className="text-sm font-semibold text-gray-900">새 문의 보내기</h2>
                <form action="/api/user/inquiry" method="POST" className="space-y-3">
          <textarea
              name="message"
              required
              rows={4}
              className="w-full border rounded-md px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="문의 내용을 적어주세요."
          />
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-md bg-blue-600 text-sm text-white font-semibold hover:bg-blue-700"
                    >
                        문의 보내기
                    </button>
                </form>
                <p className="text-xs text-gray-500">
                    관리자가 답변을 등록하면 아래 &quot;내 문의 기록&quot; 영역에서
                    답변을 확인할 수 있습니다.
                </p>
            </section>

            {/* 내 문의 기록 + 답변 표시 */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-100">내 문의 기록</h2>

                {inquiries.length === 0 ? (
                    <p className="text-xs text-gray-400">
                        아직 보낸 문의가 없습니다.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {inquiries.map((q) => {
                            const replied = !!q.replyMessage;
                            return (
                                <div
                                    key={q.id}
                                    className={`border rounded-lg p-4 space-y-2 ${
                                        replied ? "bg-green-50 border-green-300" : "bg-gray-50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                            {new Date(q.createdAt).toLocaleString("ko-KR")}
                                        </p>
                                        {replied && (
                                            <span className="px-2 py-0.5 text-[11px] rounded-full bg-green-600 text-white">
                        답변 완료
                      </span>
                                        )}
                                    </div>

                                    <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                        {q.message}
                                    </div>

                                    {replied && (
                                        <div className="mt-2 border-t pt-2 text-xs text-gray-800">
                                            <p className="font-semibold mb-1">관리자 답변</p>
                                            <p className="whitespace-pre-wrap">{q.replyMessage}</p>
                                        </div>
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
