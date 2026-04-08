export default function Footer() {
  return (
    <footer id="footer" className="border-t border-(--border) bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--primary) text-sm font-bold text-white">
              S
            </div>
            <span className="text-base font-bold text-foreground">SafeRide</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-(--text-2)">
            <a href="#why" className="hover:text-(--primary)">Why</a>
            <a href="#features" className="hover:text-(--primary)">Features</a>
            <a href="#safety" className="hover:text-(--primary)">Safety</a>
            <a href="#app-preview" className="hover:text-(--primary)">Mobile App</a>
          </div>

          <p className="text-sm text-(--text-2)">
            Safer rides for everyone. &copy; {new Date().getFullYear()} SafeRide
          </p>
        </div>
      </div>
    </footer>
  );
}
