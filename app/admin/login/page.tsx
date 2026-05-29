export default function LoginPage() {
  return (
    <main className="shell">
      <section className="panel stack" style={{ maxWidth: 520, margin: "80px auto" }}>
        <div>
          <div className="brand">Stepe Digital Screening</div>
          <p className="muted">Admin access is limited to approved Google accounts.</p>
        </div>
        <a className="button primary" href="/api/auth/signin/google">
          Sign in with Google
        </a>
      </section>
    </main>
  );
}
