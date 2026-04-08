"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [vehicle, setVehicle] = useState({
    vehicleType: "CAR",
    registrationNumber: "",
    model: "",
    color: "",
    seatsAvailable: "4",
  });

  const user = session?.user as any;
  const isDriver = user?.role === "DRIVER";

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setProfileImage(user.profileImage || user.image || "");

      if (isDriver) {
        fetch("/api/driver/profile")
          .then((r) => r.json())
          .then((d) => {
            if (d.driver?.vehicle) {
              setVehicle({
                vehicleType: d.driver.vehicle.vehicleType,
                registrationNumber: d.driver.vehicle.registrationNumber || "",
                model: d.driver.vehicle.model || "",
                color: d.driver.vehicle.color || "",
                seatsAvailable: String(d.driver.vehicle.seatsAvailable || 4),
              });
            }
          });
      }
    }
  }, [user, isDriver]);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        profileImage,
        ...(isDriver && { vehicle }),
      }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-gray-500">Manage your account details.</p>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge>{user?.role}</Badge>
          <Badge variant="default">{user?.gender}</Badge>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            id="name"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            id="email"
            label="Email"
            value={user?.email || ""}
            disabled
          />
          <Input
            id="phone"
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            id="profileImage"
            label="Profile Image URL"
            placeholder="https://..."
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
          />
        </div>
      </Card>

      {isDriver && (
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Vehicle Details
          </h2>
          <div className="flex flex-col gap-4">
            <Select
              id="vehicleType"
              label="Vehicle Type"
              value={vehicle.vehicleType}
              onChange={(e) =>
                setVehicle((v) => ({ ...v, vehicleType: e.target.value }))
              }
              options={[
                { value: "CAR", label: "Car" },
                { value: "AUTO", label: "Auto" },
                { value: "VAN", label: "Van" },
                { value: "TAXI", label: "Taxi" },
              ]}
            />
            <Input
              id="reg"
              label="Registration Number"
              value={vehicle.registrationNumber}
              onChange={(e) =>
                setVehicle((v) => ({
                  ...v,
                  registrationNumber: e.target.value,
                }))
              }
            />
            <Input
              id="vModel"
              label="Model"
              value={vehicle.model}
              onChange={(e) =>
                setVehicle((v) => ({ ...v, model: e.target.value }))
              }
            />
            <Input
              id="vColor"
              label="Color"
              value={vehicle.color}
              onChange={(e) =>
                setVehicle((v) => ({ ...v, color: e.target.value }))
              }
            />
            <Input
              id="vSeats"
              label="Seats Available"
              type="number"
              value={vehicle.seatsAvailable}
              onChange={(e) =>
                setVehicle((v) => ({ ...v, seatsAvailable: e.target.value }))
              }
            />
          </div>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} isLoading={loading}>
          Save Changes
        </Button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">
            ✓ Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
