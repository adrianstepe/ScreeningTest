export function AdminChrome({ children }: { children: React.ReactNode }) {
  return (
    <main className="shell">
      <div className="topbar">
        <a className="brand" href="/admin">
          Stepe Digital Screening
        </a>
        <a className="button" href="/api/auth/signout">
          Sign out
        </a>
      </div>
      {children}
    </main>
  );
}
