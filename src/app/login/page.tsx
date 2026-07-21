import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-charcoal">Staff sign in</h1>
        <p className="mt-1 text-sm text-charcoal-soft">Admin, cashier, and kitchen accounts.</p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
