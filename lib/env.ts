export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isApprovedAdmin(email?: string | null) {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export function authSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
}
