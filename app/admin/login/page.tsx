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
    <main className="login-shell">
      <header className="login-topbar">
        <a className="login-lockup" href="/">
          <span className="login-mark">SD</span>
          <span aria-hidden="true" className="login-divider" />
          <span className="login-name">Stepe Digital</span>
        </a>
        <a className="login-backlink" href="/">
          &lt;- Back to site
        </a>
      </header>

      <section className="login-stage" aria-labelledby="admin-access-title">
        <div className="login-card">
          <p className="login-eyebrow">Internal console</p>
          <h1 id="admin-access-title">Administrator access</h1>
          <p className="login-lede">
            Sign in to the Stepe Digital operations console. Access is restricted to
            authorized administrators only.
          </p>

          {message && (
            <div className="login-alert" role="alert">
              {message}
            </div>
          )}

          <GoogleSignInButton callbackUrl={callbackUrl} />

          <div className="login-hint">
            <svg
              aria-hidden="true"
              fill="none"
              height="14"
              viewBox="0 0 24 24"
              width="14"
            >
              <rect height="11" rx="2" stroke="currentColor" strokeWidth="2" width="18" x="3" y="11" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>
              Restricted to <span className="login-domain">@stepedigital.com</span> accounts.
              There is no public sign-up.
            </span>
          </div>

          <div className="login-contact">
            Trouble signing in? Contact{" "}
            <a href="mailto:adrians@stepedigital.com">adrians@stepedigital.com</a>.
          </div>
        </div>
      </section>

      <footer className="login-footer">Stepe Digital SIA - Reg. No. 40203711274 - Riga, Latvia</footer>
    </main>
  );
}
