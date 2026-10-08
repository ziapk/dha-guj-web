import { AuthModal } from "@/components/auth-modal";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

/** /forgot-password opened from the login modal or a site link. A direct visit renders app/forgot-password instead. */
export default function ForgotPasswordModal() {
  return (
    <AuthModal>
      <ForgotPasswordForm />
    </AuthModal>
  );
}
