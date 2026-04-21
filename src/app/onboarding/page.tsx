"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { WaveLoader } from "@/components/wave-loader";

type SessionUser = {
  role?: "PASSENGER" | "DRIVER" | "ADMIN";
  phone?: string | null;
};

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
  const [licenseDocumentFile, setLicenseDocumentFile] = useState<File | null>(
    null
  );
  const [registrationDocumentFile, setRegistrationDocumentFile] =
    useState<File | null>(null);
  const [insuranceDocumentFile, setInsuranceDocumentFile] =
    useState<File | null>(null);
  const [licenseExpiresAt, setLicenseExpiresAt] = useState("");

  const user = session?.user as SessionUser | undefined;
  const isDriver = user?.role === "DRIVER";
  const totalSteps = 2;

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (!isPending && session && !isDriver) {
      if (user?.role === "ADMIN") router.push("/admin/dashboard");
      else router.push("/passenger/dashboard");
    }
  }, [isPending, isDriver, router, session, user?.role]);

  useEffect(() => {
    if (typeof user?.phone === "string" && user.phone.trim().length > 0) {
      setPhone(user.phone);
    }
  }, [user?.phone]);

  const validateDriverDetails = () => {
    if (!phone.trim()) {
      return "Mobile number is required. Please go back and add it during registration.";
    }

    if (!licenseNumber.trim()) {
      return "License number is required.";
    }

    if (!registration.trim() || !vehicleModel.trim() || !color.trim()) {
      return "Complete all driver and vehicle details before continuing.";
    }

    const parsedSeats = Number.parseInt(seats, 10);
    if (!Number.isFinite(parsedSeats) || parsedSeats < 1) {
      return "Seats must be at least 1.";
    }

    return null;
  };

  const goToDocumentStep = () => {
    setError("");
    const validationError = validateDriverDetails();
    if (validationError) {
      setError(validationError);
      return;
    }

    setStep(2);
  };

  const handleComplete = async () => {
    setError("");
    setLoading(true);

    try {
      const detailsValidationError = validateDriverDetails();
      if (detailsValidationError) {
        setError(detailsValidationError);
        return;
      }

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          licenseNumber,
          vehicleType,
          registrationNumber: registration,
          model: vehicleModel,
          color,
          seatsAvailable: Number.parseInt(seats, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save profile");
        return;
      }

      const documents = [
        {
          documentType: "LICENSE",
          file: licenseDocumentFile,
          expiresAt: licenseExpiresAt || undefined,
        },
        {
          documentType: "VEHICLE_REGISTRATION",
          file: registrationDocumentFile,
        },
        {
          documentType: "INSURANCE",
          file: insuranceDocumentFile,
        },
      ];

      for (const document of documents) {
        if (!(document.file instanceof File)) continue;

        const payload = new FormData();
        payload.append("documentType", document.documentType);
        payload.append("file", document.file);
        if (document.expiresAt) {
          payload.append("expiresAt", document.expiresAt);
        }

        const documentRes = await fetch("/api/driver/verification/documents", {
          method: "POST",
          body: payload,
        });

        if (!documentRes.ok) {
          const documentError = await documentRes
            .json()
            .catch(() => ({ error: "Failed to submit document" }));
          setError(documentError.error || "Failed to submit document");
          return;
        }
      }

      router.push("/driver/dashboard");
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

  if (!isDriver) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <WaveLoader />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen items-center justify-center overflow-x-hidden overflow-y-auto no-scrollbar px-4 py-10">
      <div className="pointer-events-none absolute -left-10 top-8 h-36 w-36 rounded-full bg-(--primary)/10 blur-2xl sm:-left-16 sm:top-10 sm:h-44 sm:w-44" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-sky-100 blur-3xl sm:-right-16 sm:h-52 sm:w-52" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-[instrumentserif-regular] text-foreground sm:text-5xl lg:text-6xl">
            Complete driver onboarding
          </h1>
          <p className="mt-2 text-sm text-(--text-2)">
            Step {step} of {totalSteps}
          </p>
          <p className="mt-1 text-xs text-(--text-2)">
            First add driver details, then upload documents now or later from your profile.
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
                id="license"
                label="License Number"
                placeholder="DL-12345678"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
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
                id="seats"
                label="Total Seats"
                type="number"
                min="1"
                max="12"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                required
              />
              <Button onClick={goToDocumentStep} fullWidth>
                Next {"->"}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <Input
                id="licenseDoc"
                label="License Document"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setLicenseDocumentFile(e.target.files?.[0] || null)}
              />
              <Input
                id="licenseExpiry"
                label="License Expiry Date (optional)"
                type="date"
                value={licenseExpiresAt}
                onChange={(e) => setLicenseExpiresAt(e.target.value)}
              />
              <Input
                id="registrationDoc"
                label="Registration Document"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setRegistrationDocumentFile(e.target.files?.[0] || null)
                }
              />
              <Input
                id="insuranceDoc"
                label="Insurance Document"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setInsuranceDocumentFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-(--text-2)">
                You can upload all, some, or none now. Missing documents can be added later in profile.
              </p>
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
                  Finish Onboarding
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
