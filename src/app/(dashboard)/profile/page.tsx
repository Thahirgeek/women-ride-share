"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { WaveLoader } from "@/components/wave-loader";
import RatingSummary from "@/components/ratings/RatingSummary";
import RecentComments from "@/components/ratings/RecentComments";

interface DriverFeedbackComment {
  id: string;
  score: number;
  comment: string | null;
  tags: string[];
  createdAt: string;
  rater: {
    name: string;
  };
}

interface DriverDocument {
  id: string;
  documentType: "LICENSE" | "VEHICLE_REGISTRATION" | "INSURANCE" | "OTHER";
  storageUrl: string;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  rejectionReason?: string | null;
}

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
  const [driverRatingSummary, setDriverRatingSummary] = useState<{
    averageScore: number | null;
    totalRatings: number;
  }>({
    averageScore: null,
    totalRatings: 0,
  });
  const [recentFeedback, setRecentFeedback] = useState<DriverFeedbackComment[]>([]);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentSubmitLoading, setDocumentSubmitLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [documentForm, setDocumentForm] = useState({
    documentType: "LICENSE",
    storageUrl: "",
    expiresAt: "",
  });

  const user = session?.user as any;
  const isDriver = user?.role === "DRIVER";

  const loadDriverDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const response = await fetch("/api/driver/verification/documents");
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch {
      setDocumentError("Unable to load verification documents.");
    } finally {
      setDocumentsLoading(false);
    }
  };

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

            if (d.driver?.ratingSummary) {
              setDriverRatingSummary({
                averageScore:
                  typeof d.driver.ratingSummary.averageScore === "number"
                    ? d.driver.ratingSummary.averageScore
                    : null,
                totalRatings: d.driver.ratingSummary.totalRatings ?? 0,
              });
            }

            if (Array.isArray(d.driver?.recentFeedback)) {
              setRecentFeedback(d.driver.recentFeedback);
            }
          });

        loadDriverDocuments();
      }
    }
  }, [user, isDriver]);

  const handleDocumentSubmit = async () => {
    setDocumentError("");

    if (!documentForm.storageUrl.trim()) {
      setDocumentError("Document URL is required.");
      return;
    }

    setDocumentSubmitLoading(true);
    try {
      const response = await fetch("/api/driver/verification/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: documentForm.documentType,
          storageUrl: documentForm.storageUrl,
          expiresAt: documentForm.expiresAt || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit document.");
      }

      setDocumentForm({
        documentType: "LICENSE",
        storageUrl: "",
        expiresAt: "",
      });
      await loadDriverDocuments();
    } catch (err) {
      setDocumentError(
        err instanceof Error ? err.message : "Failed to submit document."
      );
    } finally {
      setDocumentSubmitLoading(false);
    }
  };

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
        <WaveLoader />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-[instrumentserif-regular] text-foreground sm:text-5xl lg:text-6xl">Profile</h1>
        <p className="mt-1 text-(--text-2)">Manage your account details.</p>
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
        <>
          <Card className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
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

          <Card className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-foreground">Verification Documents</h2>
            <p className="mb-4 text-sm text-(--text-2)">
              Upload links to your verification documents so admin can review and approve your profile.
            </p>

            {documentError && (
              <div className="mb-4 rounded-lg border border-(--danger)/20 bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
                {documentError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Select
                id="documentType"
                label="Document Type"
                value={documentForm.documentType}
                onChange={(e) =>
                  setDocumentForm((prev) => ({
                    ...prev,
                    documentType: e.target.value,
                  }))
                }
                options={[
                  { value: "LICENSE", label: "License" },
                  {
                    value: "VEHICLE_REGISTRATION",
                    label: "Vehicle Registration",
                  },
                  { value: "INSURANCE", label: "Insurance" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
              <Input
                id="documentUrl"
                label="Document URL"
                placeholder="https://..."
                value={documentForm.storageUrl}
                onChange={(e) =>
                  setDocumentForm((prev) => ({
                    ...prev,
                    storageUrl: e.target.value,
                  }))
                }
              />
              <Input
                id="documentExpiry"
                label="Expiry Date (optional)"
                type="date"
                value={documentForm.expiresAt}
                onChange={(e) =>
                  setDocumentForm((prev) => ({
                    ...prev,
                    expiresAt: e.target.value,
                  }))
                }
              />
            </div>

            <div className="mt-4">
              <Button onClick={handleDocumentSubmit} isLoading={documentSubmitLoading}>
                Submit Document
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-[inter-semibold] text-foreground">
                Submitted Documents
              </h3>

              {documentsLoading ? (
                <p className="text-sm text-(--text-2)">Loading documents...</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-(--text-2)">No documents submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-lg border border-border bg-(--surface) px-3 py-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-[inter-semibold] text-foreground">
                          {document.documentType.replaceAll("_", " ")}
                        </p>
                        <Badge
                          variant={
                            document.reviewStatus === "APPROVED"
                              ? "success"
                              : document.reviewStatus === "REJECTED"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {document.reviewStatus}
                        </Badge>
                      </div>
                      <a
                        href={document.storageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-primary underline"
                      >
                        View document
                      </a>
                      <p className="mt-1 text-xs text-(--text-2)">
                        Submitted {new Date(document.submittedAt).toLocaleString()}
                      </p>
                      {document.reviewStatus === "REJECTED" &&
                        document.rejectionReason && (
                          <p className="mt-1 text-xs text-(--danger)">
                            Reason: {document.rejectionReason}
                          </p>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="mb-2 text-lg font-bold text-foreground">Passenger Feedback</h2>
            <RatingSummary
              averageScore={driverRatingSummary.averageScore}
              totalRatings={driverRatingSummary.totalRatings}
            />
            <div className="mt-4">
              <RecentComments comments={recentFeedback} />
            </div>
          </Card>
        </>
      )}

      <div className="flex flex-col gap-3 font-[inter-bold] sm:flex-row sm:items-center sm:gap-4">
        <Button onClick={handleSave} isLoading={loading}>
          Save Changes
        </Button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">
            OK Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
