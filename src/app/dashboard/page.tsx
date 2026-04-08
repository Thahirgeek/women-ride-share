import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  if (user.role === "DRIVER") {
    redirect("/driver/dashboard");
  } else if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else {
    redirect("/passenger/dashboard");
  }
}
