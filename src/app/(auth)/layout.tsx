export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-16 top-12 h-44 w-44 rounded-full bg-(--primary)/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-52 w-52 rounded-full bg-sky-100 blur-3xl" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
