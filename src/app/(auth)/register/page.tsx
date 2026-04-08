"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
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
      const res = await (signUp.email as any)({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        gender: form.gender,
      });
      if (res.error) {
        setError(res.error.message || "Registration failed");
      } else {
        router.push("/onboarding");
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">SafeRide</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
        <p className="mt-2 text-sm text-gray-500">
          Join SafeRide for safer shared rides
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
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
              { value: "PASSENGER", label: "🧳 Find rides (Passenger)" },
              { value: "DRIVER", label: "🚗 Offer rides (Driver)" },
            ]}
          />
          <Button type="submit" fullWidth isLoading={loading}>
            Create account
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-gray-900 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
