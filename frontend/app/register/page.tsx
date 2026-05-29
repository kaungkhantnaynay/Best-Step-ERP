import { AuthPanel } from "@/components/public/auth-panel";
import { PublicShell } from "@/components/public/public-shell";

export default function RegisterPage() {
  return (
    <PublicShell>
      <AuthPanel mode="register" />
    </PublicShell>
  );
}
