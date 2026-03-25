"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@phosphor-icons/react/dist/ssr";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <Button
      onClick={handleSignIn}
      size="lg"
      className="w-full"
      disabled={isLoading}
    >
      {isLoading && <Spinner size={16} className="mr-2 animate-spin" />}
      Sign in with Google
    </Button>
  );
}
