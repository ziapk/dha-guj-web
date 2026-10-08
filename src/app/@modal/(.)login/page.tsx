import { Suspense } from "react";
import { AuthModal } from "@/components/auth-modal";
import { LoginForm } from "@/components/login-form";

/** /login opened from a link on the site: shown over the current page. A direct visit renders app/login instead. */
export default function LoginModal() {
  return (
    <AuthModal>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthModal>
  );
}
