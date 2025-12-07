// app/user/page.tsx
import { auth } from "@/auth";
import LogoutButton from "../../components/LogoutButton";

export default async function UserHomePage() {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>로그인이 필요합니다. /login/user 에서 로그인 해 주세요.</p>
            </main>
        );
    }

    const user = session.user;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 space-y-4">
            <h1 className="text-2xl font-bold">사용자 메인</h1>
            <p className="text-gray-600">
                안녕하세요, <span className="font-semibold">{user.name}</span>님
                ({user.email}) 👋
            </p>
            <p className="text-sm text-gray-500">
                역할: {user.role}
            </p>

            <LogoutButton />
        </main>
    );
}
