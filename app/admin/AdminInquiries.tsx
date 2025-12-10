// app/admin/AdminInquiries.tsx
"use client";

import { useEffect, useState } from "react";

type Inquiry = {
    id: string;
    message: string;
    createdAt: string;
    replyMessage: string | null;
    repliedAt: string | null;
    repliedByEmail: string | null;
    sender: {
        id: string;
        name: string | null;
        email: string;
        grade: number | null;
        classRoom: number | null;
    };
};

export default function AdminInquiries() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    // 초기 로드
    async function load() {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/inquiries");
            const data = await res.json();
            if (res.ok) {
                setInquiries(data.inquiries ?? []);
                const initial: Record<string, string> = {};
                (data.inquiries ?? []).forEach((q: Inquiry) => {
                    initial[q.id] = q.replyMessage ?? "";
                });
                setDrafts(initial);
            } else {
                alert(data.error ?? "문의 목록을 불러오지 못했습니다.");
            }
        } catch (e) {
            console.error(e);
            alert("문의 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const handleChangeDraft = (id: string, value: string) => {
        setDrafts((prev) => ({ ...prev, [id]: value }));
    };

    const handleSaveReply = async (id: string) => {
        const replyMessage = (drafts[id] ?? "").trim();
        if (!replyMessage) {
            alert("답변 내용을 입력하세요.");
            return;
        }

        try {
            setSavingId(id);
            const res = await fetch(`/api/admin/inquiries/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ replyMessage }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error ?? "답변 저장 중 오류가 발생했습니다.");
                return;
            }

            // 목록 새로고침
            await load();
            alert("답변이 저장되었습니다.");
        } catch (e) {
            console.error(e);
            alert("답변 저장 중 오류가 발생했습니다.");
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("이 문의를 관리자 목록에서 숨길까요? (학생 화면에서는 남아 있습니다.)")) {
            return;
        }

        try {
            setDeletingId(id);
            const res = await fetch(`/api/admin/inquiries/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error ?? "삭제 중 오류가 발생했습니다.");
                return;
            }

            // 클라이언트 목록에서 제거
            setInquiries((prev) => prev.filter((q) => q.id !== id));
        } catch (e) {
            console.error(e);
            alert("삭제 중 오류가 발생했습니다.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-100">문의 관리</h2>

            {loading ? (
                <p className="text-sm text-gray-300">문의 내역을 불러오는 중...</p>
            ) : inquiries.length === 0 ? (
                <p className="text-sm text-gray-300">표시할 문의가 없습니다.</p>
            ) : (
                <div className="space-y-3">
                    {inquiries.map((q) => {
                        const senderLabel = q.sender
                            ? `${q.sender.name ?? "이름 없음"} (${q.sender.email})${
                                q.sender.grade && q.sender.classRoom
                                    ? ` / ${q.sender.grade}학년 ${q.sender.classRoom}반`
                                    : ""
                            }`
                            : "알 수 없는 사용자";

                        const hasReply = !!q.replyMessage;

                        return (
                            <div
                                key={q.id}
                                className="border border-gray-700 rounded-lg bg-gray-900 p-4 space-y-2"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-100">
                                            {senderLabel}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(q.createdAt).toLocaleString("ko-KR")}
                                        </p>
                                    </div>
                                    {hasReply && (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-700 text-green-50">
                      답변 완료
                    </span>
                                    )}
                                </div>

                                <div className="text-sm text-gray-100 whitespace-pre-wrap">
                                    {q.message}
                                </div>

                                <div className="space-y-2">
                  <textarea
                      className="w-full rounded-md border border-gray-600 bg-gray-800 text-sm text-gray-50 p-2"
                      rows={3}
                      placeholder="관리자 답변을 입력하세요."
                      value={drafts[q.id] ?? ""}
                      onChange={(e) => handleChangeDraft(q.id, e.target.value)}
                  />

                                    {q.replyMessage && q.repliedAt && (
                                        <p className="text-xs text-gray-400">
                                            마지막 답변:{" "}
                                            {new Date(q.repliedAt).toLocaleString("ko-KR")}
                                        </p>
                                    )}

                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            disabled={deletingId === q.id}
                                            className="px-3 py-1 rounded-md bg-red-700 text-xs text-white hover:bg-red-800 disabled:opacity-60"
                                        >
                                            {deletingId === q.id ? "삭제 중..." : "목록에서 삭제"}
                                        </button>
                                        <button
                                            onClick={() => handleSaveReply(q.id)}
                                            disabled={savingId === q.id}
                                            className="px-3 py-1 rounded-md bg-blue-600 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
                                        >
                                            {savingId === q.id ? "저장 중..." : "답변 저장"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
