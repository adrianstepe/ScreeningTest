import { GoogleSignInButton } from "./GoogleSignInButton";

type LoginSearchParams = Promise<{
  callbackUrl?: string | string[];
  error?: string | string[];
}>;

const errorMessages: Record<string, string> = {
  AccessDenied: "This Google account is not on the approved admin list.",
  Configuration: "Google sign-in is not configured correctly on the server.",
  OAuthCallback: "Google returned an OAuth callback error. Check the production callback URL.",
  OAuthSignin: "Google sign-in could not start. Check the Google OAuth credentials.",
  google: "The old direct Google sign-in URL was opened. Use the button below to start a secure sign-in."
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function safeCallbackUrl(value?: string) {
  if (!value) return "/admin";
  if (value.startsWith("/")) return value === "/" ? "/admin" : value;

  try {
    const url = new URL(value);
    return url.pathname === "/" ? "/admin" : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}

export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const params = await searchParams;
  const error = firstValue(params.error);
  const message = error ? errorMessages[error] || "Google sign-in failed. Try again." : null;
  const callbackUrl = safeCallbackUrl(firstValue(params.callbackUrl));

  return (
    <main className="shell">
      <section className="panel stack" style={{ maxWidth: 520, margin: "80px auto" }}>
        <div>
          <div className="brand">Stepe Digital Screening</div>
          <p className="muted">Admin access is limited to approved Google accounts.</p>
        </div>
        {message && <p className="warning" style={{ padding: 12, borderRadius: 8 }}>{message}</p>}
        <GoogleSignInButton callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
