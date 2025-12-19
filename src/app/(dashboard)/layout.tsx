import { auth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { redirect } from "next/navigation";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardLayout user={session.user}>{children}</DashboardLayout>;
}
