import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authSecret, isApprovedAdmin } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    })
  ],
  secret: authSecret(),
  callbacks: {
    async signIn({ profile }) {
      return isApprovedAdmin(profile?.email);
    },
    async session({ session }) {
      if (session.user?.email && !isApprovedAdmin(session.user.email)) {
        return { ...session, user: { ...session.user, email: undefined } };
      }
      return session;
    }
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login"
  }
};

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isApprovedAdmin(session?.user?.email)) redirect("/admin/login");
  return session;
}
