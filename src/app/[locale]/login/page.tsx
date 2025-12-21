import { getOAuthStatus } from "@/server/system-config";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Get OAuth configuration status from server
  const oauthStatus = await getOAuthStatus();

  return <LoginForm oauthStatus={oauthStatus} />;
}
