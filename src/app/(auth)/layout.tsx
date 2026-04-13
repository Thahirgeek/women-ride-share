export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-10 top-10 h-36 w-36 rounded-full bg-(--primary)/10 blur-2xl sm:-left-16 sm:top-12 sm:h-44 sm:w-44" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-sky-100 blur-3xl sm:-right-16 sm:h-52 sm:w-52" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
