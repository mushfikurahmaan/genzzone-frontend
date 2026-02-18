import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link
        href="/"
        className="btn-outline rounded px-4 py-2 text-sm font-medium"
      >
        Back to home
      </Link>
    </section>
  );
}
