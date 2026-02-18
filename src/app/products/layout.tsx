// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

