"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type RegisterSessionUser = {
  error?: {
    message?: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "FEMALE",
    role: "PASSENGER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const emailSignUp = signUp.email as unknown as (payload: {
        email: string;
        password: string;
        name: string;
        phone: string;
        role: string;
        gender: string;
      }) => Promise<RegisterSessionUser>;

      const res = await emailSignUp({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        role: form.role,
        gender: form.gender,
      });
      if (res.error) {
        setError(res.error.message || "Registration failed");
      } else {
        if (form.role === "DRIVER") {
          router.push("/onboarding");
          return;
        }

        const passengerBootstrap = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: form.phone }),
        });

        if (!passengerBootstrap.ok) {
          const passengerError = await passengerBootstrap
            .json()
            .catch(() => ({ error: "Failed to complete passenger setup." }));
          setError(passengerError.error || "Failed to complete passenger setup.");
          return;
        }

        router.push("/passenger/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white">
                <img src="/8442672.svg" className="bg-transparent" alt="SafeRide"></img>
              </div>
          <span className="text-lg font-bold text-foreground">SafeRide</span>
        </Link>
        <h1 className="text-3xl font-[instrumentserif-regular] text-foreground sm:text-5xl lg:text-6xl">Create an account</h1>
        <p className="mt-2 text-sm text-(--text-2)">
          Join SafeRide for safer shared rides
        </p>
      </div>

      <Card className="shadow-[0_-3px_6px_rgba(255,255,255,1),0_-1px_0px_rgba(255,255,255,1),0_8px_16px_rgba(0,0,0,0.20),0_3px_6px_rgba(0,0,0,0.08),1px_0_2px_rgba(0,0,0,0.03),-1px_0_2px_rgba(0,0,0,0.03)]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-(--danger)/20 bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
              {error}
            </div>
          )}
          <Input
            id="name"
            label="Full Name"
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
          <Input
            id="phone"
            label="Mobile Number"
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min 8 characters"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            minLength={8}
          />
          <Select
            id="gender"
            label="Gender"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            options={[
              { value: "FEMALE", label: "Female" },
              { value: "MALE", label: "Male" },
              { value: "OTHER", label: "Other" },
            ]}
          />
          <Select
            id="role"
            label="I want to"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            options={[
              { value: "PASSENGER", label: "Find rides (Passenger)" },
              { value: "DRIVER", label: "Offer rides (Driver)" },
            ]}
          />
          {form.role === "DRIVER" && (
            <p className="text-xs text-(--text-2)">
              Driver verification details and document upload happen in onboarding after signup.
            </p>
          )}

          <Button type="submit" fullWidth isLoading={loading}>
            Create account
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-(--text-2)">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
