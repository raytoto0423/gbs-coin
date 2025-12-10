// app/admin/AdminInquiriesClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SafeInquiry = {
    id: string;
    message: string;
    createdAt: string;
    replyMessage: string | null;
    repliedAt: string | null;
    repliedByEmail: string | null;
    sender: {
        name: string | null;
        email: string;
        grade: number | null;
        classRoom: number | null;
    };
};

export default function AdminInquiriesClient({
                                                 inquiries,
                                             }: {
    inquiries: SafeInquiry[];
}) {
    const router = useRouter();
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

    const handleChangeDraft = (id: string, value: string) => {
        setReplyDrafts((prev) => ({ ...prev, [id]: value }));
    };

    const handleDelete = async (id: string) => {
        if (!confirm("이 문의를 삭제할까요?")) return;
        try {
            const res = await fetch(`/api/admin/inquiries/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                alert(data?.error ?? "삭제 중 오류가 발생했습니다.");
                return;
            }
            router.refresh();
        } catch (e) {
            console.error(e);
            alert("삭제 요청 중 오류가 발생했습니다.");
        }
    };

    const handleReply = async (id: string) => {
        const message =
            replyDrafts[id]?.trim() ??
            "";

        if (!message) {
            alert("답변 내용을 입력하세요.");
            return;
        }

        try {
            const res = await fetch(`/api/admin/inquiries/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ replyMessage: message }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                alert(data?.error ?? "답변 전송 중 오류가 발생했습니다.");
                return;
            }

            // 답변 완료 후 목록 새로고침
            router.refresh();
        } catch (e) {
            console.error(e);
            alert("답변 요청 중 오류가 발생했습니다.");
        }
    };

    if (inquiries.length === 0) {
        return (
            <section className="mt-8 p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">문의 내역</h2>
                <p className="text-sm text-gray-600">
                    아직 접수된 문의가 없습니다.
                </p>
            </section>
        );
    }

    return (
        <section className="mt-8 p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">최근 문의 내역</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto text-sm">
                {inquiries.map((inq) => {
                    const created = new Date(inq.createdAt).toLocaleString(
                        "ko-KR"
                    );
                    const replied =
                        inq.repliedAt &&
                        new Date(inq.repliedAt).toLocaleString("ko-KR");

                    const displayClass =
                        inq.sender.grade && inq.sender.classRoom
                            ? `${inq.sender.grade}학년 ${inq.sender.classRoom}반`
                            : null;

                    return (
                        <div
                            key={inq.id}
                            className="border rounded-md p-3 bg-gray-50 space-y-2"
                        >
                            {/* 보낸 사람 정보 */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {inq.sender.name ??
                                            inq.sender.email}
                                        {displayClass && (
                                            <span className="ml-1 text-xs text-gray-500">
                                                ({displayClass})
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {inq.sender.email}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {created}
                                </p>
                            </div>

                            {/* 문의 내용 */}
                            <p className="text-gray-900 whitespace-pre-wrap">
                                {inq.message}
                            </p>

                            {/* 답변이 이미 있는 경우 */}
                            {inq.replyMessage && (
                                <div className="mt-2 p-2 rounded-md bg-white border border-blue-200">
                                    <p className="text-xs font-semibold text-blue-700 mb-1">
                                        관리자 답변
                                        {inq.repliedByEmail && (
                                            <span className="ml-1 text-[10px] text-gray-500">
                                                ({inq.repliedByEmail})
                                            </span>
                                        )}
                                        {replied && (
                                            <span className="ml-1 text-[10px] text-gray-500">
                                                {replied}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-800 whitespace-pre-wrap">
                                        {inq.replyMessage}
                                    </p>
                                </div>
                            )}

                            {/* 답변 작성 영역 */}
                            <div className="mt-2 space-y-2">
                                <textarea
                                    className="w-full border rounded-md px-2 py-1 text-xs"
                                    rows={2}
                                    placeholder={
                                        inq.replyMessage
                                            ? "답변을 수정하려면 여기 입력 후 '답변 보내기'를 누르세요."
                                            : "여기에 관리자 답변을 입력하세요."
                                    }
                                    value={replyDrafts[inq.id] ?? ""}
                                    onChange={(e) =>
                                        handleChangeDraft(
                                            inq.id,
                                            e.target.value
                                        )
                                    }
                                />
                                <div className="flex justify-between">
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700"
                                        onClick={() => handleReply(inq.id)}
                                    >
                                        답변 보내기
                                    </button>

                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded-md bg-red-500 text-white text-xs hover:bg-red-600"
                                        onClick={() => handleDelete(inq.id)}
                                    >
                                        문의 삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
