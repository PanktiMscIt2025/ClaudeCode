import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-soft">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-ink-muted">The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
      <ButtonLink href="/" className="mt-6">
        Go home
      </ButtonLink>
    </div>
  );
}
