import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/layout/DashboardNav";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "DRIVER") redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <DashboardNav role="DRIVER" userName={user.name} />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
