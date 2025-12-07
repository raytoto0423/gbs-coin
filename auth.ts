// auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

const SCHOOL_EMAIL_REGEX =
    /^gbs\.(s|t)(\d{2})(\d{4})@ggh\.goe\.go\.kr$/i;

const ADMIN_EMAIL = "dhhwang423@gmail.com";

declare module "next-auth" {
    interface User {
        id: string;
        name: string;
        email: string;
        role: string;   // "STUDENT" | "TEACHER" | "ADMIN" | "BOOTH"
        boothId?: string | null;
    }

    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            boothId?: string | null;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string;
        role?: string;
        boothId?: string | null;
    }
}

const authConfig: NextAuthConfig = {
    providers: [
        //
        // 1) 구글 로그인 (학생/선생/관리자)
        //
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        //
        // 2) 부스 로그인 (반 부스 ID + 비밀번호)
        //
        Credentials({
            id: "booth-login",
            name: "Booth Login",
            credentials: {
                boothId: { label: "부스 ID", type: "text" },
                password: { label: "비밀번호", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.boothId || !credentials?.password) return null;

                const booth = await prisma.booth.findUnique({
                    where: { id: credentials.boothId },
                });

                if (!booth) return null;

                const ok = await compare(credentials.password, booth.passwordHash);
                if (!ok) return null;

                // 부스 계정용 유저 객체
                return {
                    id: booth.id,
                    name: booth.name,
                    email: `${booth.id}@booth.local`, // 형식 맞추기용 가짜 이메일
                    role: "BOOTH",
                    boothId: booth.id,
                };
            },
        }),
    ],

    callbacks: {
        //
        // 1) signIn: 구글 로그인 이메일 필터링 & User 생성/업데이트
        //
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const email = user.email ?? "";

                // 관리자 메일 허용
                if (email === ADMIN_EMAIL) {
                    await prisma.user.upsert({
                        where: { email },
                        update: { name: user.name ?? "관리자", role: "ADMIN" },
                        create: {
                            email,
                            name: user.name ?? "관리자",
                            role: "ADMIN",
                        },
                    });
                    return true;
                }

                // 학교 이메일 형식 체크
                const match = email.match(SCHOOL_EMAIL_REGEX);
                if (!match) {
                    // 학교 계정도 아니고 관리자도 아니면 거절
                    return false;
                }

                const kind = match[1].toLowerCase(); // 's' or 't'
                const role = kind === "s" ? "STUDENT" : "TEACHER";

                await prisma.user.upsert({
                    where: { email },
                    update: { name: user.name ?? "", role },
                    create: {
                        email,
                        name: user.name ?? "",
                        role,
                    },
                });

                return true;
            }

            // 부스(Credentials)는 authorize에서 이미 검증함
            return true;
        },

        //
        // 2) JWT 토큰에 userId/role/boothId 싣기
        //
        async jwt({ token, user, account }) {
            // 로그인 직후
            if (user && account) {
                if (account.provider === "google") {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: user.email! },
                    });

                    if (dbUser) {
                        token.userId = dbUser.id;
                        token.role = dbUser.role;
                        token.boothId = null;
                    }
                }
                // 👇 여기만 변경: "credentials" → "booth-login"
                else if (account.provider === "booth-login") {
                    token.userId = user.id as string;
                    token.role = "BOOTH";
                    token.boothId = (user as any).boothId ?? user.id;
                }
            }

            return token;
        },
        //
        // 3) 세션 객체에 토큰 정보 복사
        //
        async session({ session, token }) {
            if (session.user) {
                session.user.id = (token.userId as string) ?? "";
                session.user.email = session.user.email ?? "";
                session.user.role = (token.role as string) ?? "";
                session.user.boothId = (token.boothId as string | null) ?? null;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login/user", // 기본 로그인 페이지
    },

    session: {
        strategy: "jwt",
    },

    secret: process.env.NEXTAUTH_SECRET,
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
