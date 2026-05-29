"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  return (
    <button
      className="button primary"
      disabled={isSigningIn}
      onClick={() => {
        setIsSigningIn(true);
        void signIn("google", { callbackUrl });
      }}
      type="button"
    >
      {isSigningIn ? "Opening Google..." : "Sign in with Google"}
    </button>
  );
}
