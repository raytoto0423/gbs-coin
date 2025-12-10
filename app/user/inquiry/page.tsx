// app/user/inquiry/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import InquiryForm from "./InquiryForm";

export default async function InquiryPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login/user");
    }

    return (
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <h1 className="text-2xl font-bold text-gray-50">관리자에게 문의하기</h1>
            <p className="text-sm text-gray-300">
                사이트 사용 중 불편한 점이나 문의 사항이 있으면 아래에 적어 주세요.
                <br />
                (이름, 이메일, 학급 정보는 자동으로 함께 전달됩니다.)
            </p>
            <InquiryForm />
        </main>
    );
}
