"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { WaveLoader } from "@/components/wave-loader";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("CAR");
  const [registration, setRegistration] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("4");
  const [licenseDocumentUrl, setLicenseDocumentUrl] = useState("");
  const [registrationDocumentUrl, setRegistrationDocumentUrl] = useState("");
  const [insuranceDocumentUrl, setInsuranceDocumentUrl] = useState("");
  const [licenseExpiresAt, setLicenseExpiresAt] = useState("");

  const user = session?.user as any;
  const isDriver = user?.role === "DRIVER";
  const totalSteps = isDriver ? 2 : 1;

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  const handleComplete = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          ...(isDriver && {
            licenseNumber,
            vehicleType,
            registrationNumber: registration,
            model: vehicleModel,
            color,
            seatsAvailable: parseInt(seats),
          }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save profile");
        return;
      }

      if (isDriver) {
        const documents = [
          {
            documentType: "LICENSE",
            storageUrl: licenseDocumentUrl,
            expiresAt: licenseExpiresAt || undefined,
          },
          {
            documentType: "VEHICLE_REGISTRATION",
            storageUrl: registrationDocumentUrl,
          },
          {
            documentType: "INSURANCE",
            storageUrl: insuranceDocumentUrl,
          },
        ].filter((document) => document.storageUrl.trim().length > 0);

        for (const document of documents) {
          const documentRes = await fetch("/api/driver/verification/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(document),
          });

          if (!documentRes.ok) {
            const documentError = await documentRes
              .json()
              .catch(() => ({ error: "Failed to submit document" }));
            setError(documentError.error || "Failed to submit document");
            return;
          }
        }
      }

      const role = user?.role;
      if (role === "DRIVER") router.push("/driver/dashboard");
      else if (role === "ADMIN") router.push("/admin/dashboard");
      else router.push("/passenger/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <WaveLoader />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-10 top-8 h-36 w-36 rounded-full bg-(--primary)/10 blur-2xl sm:-left-16 sm:top-10 sm:h-44 sm:w-44" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-sky-100 blur-3xl sm:-right-16 sm:h-52 sm:w-52" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-[instrumentserif-regular] text-foreground sm:text-5xl lg:text-6xl">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-(--text-2)">
            Step {step} of {totalSteps}
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-border">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="bg-white/95">
          {error && (
            <div className="mb-4 rounded-lg border border-(--danger)/20 bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Input
                id="phone"
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              {isDriver ? (
                <Button onClick={() => setStep(2)} fullWidth>
                  Next {"->"}
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  isLoading={loading}
                  fullWidth
                >
                  Complete Setup
                </Button>
              )}
            </div>
          )}

          {step === 2 && isDriver && (
            <div className="flex flex-col gap-4">
              <Input
                id="license"
                label="License Number"
                placeholder="DL-12345678"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
              />
              <Input
                id="licenseDoc"
                label="License Document URL"
                placeholder="https://..."
                value={licenseDocumentUrl}
                onChange={(e) => setLicenseDocumentUrl(e.target.value)}
                required
              />
              <Input
                id="licenseExpiry"
                label="License Expiry Date (optional)"
                type="date"
                value={licenseExpiresAt}
                onChange={(e) => setLicenseExpiresAt(e.target.value)}
              />
              <Select
                id="vehicleType"
                label="Vehicle Type"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                options={[
                  { value: "CAR", label: "Car" },
                  { value: "AUTO", label: "Auto" },
                  { value: "VAN", label: "Van" },
                  { value: "TAXI", label: "Taxi" },
                ]}
              />
              <Input
                id="registration"
                label="Registration Number"
                placeholder="KA-01-AB-1234"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                required
              />
              <Input
                id="registrationDoc"
                label="Registration Document URL"
                placeholder="https://..."
                value={registrationDocumentUrl}
                onChange={(e) => setRegistrationDocumentUrl(e.target.value)}
              />
              <Input
                id="model"
                label="Vehicle Model"
                placeholder="Toyota Camry"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                required
              />
              <Input
                id="color"
                label="Vehicle Color"
                placeholder="White"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
              />
              <Input
                id="insuranceDoc"
                label="Insurance Document URL"
                placeholder="https://..."
                value={insuranceDocumentUrl}
                onChange={(e) => setInsuranceDocumentUrl(e.target.value)}
              />
              <Input
                id="seats"
                label="Total Seats"
                type="number"
                min="1"
                max="12"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                required
              />
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  {"<-"} Back
                </Button>
                <Button
                  onClick={handleComplete}
                  isLoading={loading}
                  className="flex-1"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
