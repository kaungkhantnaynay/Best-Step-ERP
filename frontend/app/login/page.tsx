import { AuthPanel } from "@/components/public/auth-panel";
import { PublicShell } from "@/components/public/public-shell";

export default function LoginPage() {
  return (
    <PublicShell>
      <AuthPanel mode="login" />
    </PublicShell>
  );
}
