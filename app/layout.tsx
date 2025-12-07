// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "../components/AuthSessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "GBS Coin",
    description: "GBS Festival coin system",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
        <body className={inter.className}>
        {/* ✅ 여기서 전체 앱을 SessionProvider로 감싸줌 */}
        <AuthSessionProvider>{children}</AuthSessionProvider>
        </body>
        </html>
    );
}
