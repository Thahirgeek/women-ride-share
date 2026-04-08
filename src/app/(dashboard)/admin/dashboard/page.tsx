"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

type Tab = "users" | "rides" | "drivers";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  gender: string;
  createdAt: string;
}

interface Ride {
  id: string;
  source: string;
  destination: string;
  status: string;
  createdAt: string;
  driver: { user: { name: string } };
}

interface Driver {
  id: string;
  licenseNumber: string;
  isAvailable: boolean;
  isVerified: boolean;
  user: { name: string; email: string };
  vehicle?: { vehicleType: string; model: string };
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === "users") {
      fetch("/api/admin/users")
        .then((r) => r.json())
        .then((d) => { setUsers(d.users || []); setLoading(false); });
    } else if (tab === "rides") {
      fetch("/api/admin/rides")
        .then((r) => r.json())
        .then((d) => { setRides(d.rides || []); setLoading(false); });
    } else {
      fetch("/api/admin/users?drivers=true")
        .then((r) => r.json())
        .then((d) => { setDrivers(d.drivers || []); setLoading(false); });
    }
  }, [tab]);

  const toggleVerify = async (driverId: string) => {
    await fetch(`/api/admin/drivers/${driverId}/verify`, { method: "PATCH" });
    // re-fetch
    const r = await fetch("/api/admin/users?drivers=true");
    const d = await r.json();
    setDrivers(d.drivers || []);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "rides", label: "Rides" },
    { key: "drivers", label: "Drivers" },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-(--text-2)">
          Manage users, rides, and drivers.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-(--bg-muted) p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              tab === t.key
                ? "bg-white text-foreground shadow-sm"
                : "text-(--text-2) hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {tab === "users" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--border)">
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Name</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Email</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Role</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Gender</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-(--border)">
                        <td className="py-3 font-medium text-foreground">{u.name}</td>
                        <td className="py-3 text-(--text-2)">{u.email}</td>
                        <td className="py-3"><Badge>{u.role}</Badge></td>
                        <td className="py-3 text-(--text-2)">{u.gender}</td>
                        <td className="py-3 text-(--text-2)">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Rides Tab */}
          {tab === "rides" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--border)">
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Driver</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Route</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Status</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map((r) => (
                      <tr key={r.id} className="border-b border-(--border)">
                        <td className="py-3 font-medium text-foreground">{r.driver.user.name}</td>
                        <td className="py-3 text-(--text-2)">{r.source} Ã¢â€ â€™ {r.destination}</td>
                        <td className="py-3"><Badge>{r.status}</Badge></td>
                        <td className="py-3 text-(--text-2)">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Drivers Tab */}
          {tab === "drivers" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--border)">
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Name</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">License</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Vehicle</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Available</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((d) => (
                      <tr key={d.id} className="border-b border-(--border)">
                        <td className="py-3 font-medium text-foreground">{d.user.name}</td>
                        <td className="py-3 text-(--text-2)">{d.licenseNumber || "Ã¢â‚¬â€"}</td>
                        <td className="py-3 text-(--text-2)">
                          {d.vehicle ? `${d.vehicle.vehicleType} - ${d.vehicle.model}` : "Ã¢â‚¬â€"}
                        </td>
                        <td className="py-3">
                          <Badge variant={d.isAvailable ? "success" : "default"}>
                            {d.isAvailable ? "Online" : "Offline"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => toggleVerify(d.id)}
                            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer ${
                              d.isVerified ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                                d.isVerified ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}
