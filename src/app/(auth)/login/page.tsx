"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message || "Invalid credentials");
      } else {
        router.push("/dashboard");
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
                <img src="/8442672.svg" className="bg-transparent"></img>
              </div>
          <span className="text-lg font-bold text-foreground">SafeRide</span>
        </Link>
        <h1 className="text-6xl font-[instrumentserif-regular] text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-(--text-2)">
          Sign in to your account to continue
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
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth isLoading={loading}>
            Sign in
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-(--text-2)">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-(--primary) hover:underline"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
