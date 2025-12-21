"use client";

import { useState, useEffect } from "react";
import { checkEmailVerificationRequired } from "@/server/email-verification";
import { RegisterForm } from "./register-form";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [emailVerificationRequired, setEmailVerificationRequired] = useState<boolean | null>(null);

  useEffect(() => {
    checkEmailVerificationRequired().then(setEmailVerificationRequired);
  }, []);

  // Show loading while checking configuration
  if (emailVerificationRequired === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return <RegisterForm emailVerificationRequired={emailVerificationRequired} />;
}
