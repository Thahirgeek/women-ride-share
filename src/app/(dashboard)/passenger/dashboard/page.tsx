import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default async function PassengerDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as any;

  const passenger = await prisma.passenger.findUnique({
    where: { userId: user.id },
    include: {
      bookings: {
        include: {
          ride: {
            include: { driver: { include: { user: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  const totalBookings = passenger?.bookings.length ?? 0;
  const upcomingBookings =
    passenger?.bookings.filter(
      (b) =>
        b.status !== "CANCELLED" &&
        (b.ride.status === "OPEN" || b.ride.status === "BOOKED")
    ).length ?? 0;

  const statusVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "CONFIRMED":
        return "success";
      case "CANCELLED":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-gray-500">Here&apos;s your ride overview.</p>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-gray-500">Total Rides</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {totalBookings}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Upcoming Bookings</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {upcomingBookings}
          </p>
        </Card>
      </div>

      {/* Quick action */}
      <div className="mb-8">
        <Link href="/passenger/search">
          <Button variant="primary">🔍 Search for a Ride</Button>
        </Link>
      </div>

      {/* Recent bookings */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Recent Bookings
        </h2>
        {!passenger || passenger.bookings.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-gray-500 py-6">
              No bookings yet. Start by searching for a ride!
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {passenger.bookings.map((booking) => (
              <Card key={booking.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-900">
                      {booking.ride.source}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-gray-900">
                      {booking.ride.destination}
                    </span>
                  </div>
                  <Badge variant={statusVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Driver: {booking.ride.driver.user.name} •{" "}
                  {new Date(booking.ride.scheduledAt).toLocaleDateString()} •{" "}
                  ₹{booking.ride.fare}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
