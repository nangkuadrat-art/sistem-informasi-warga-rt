import ResponsiveShell from '@/components/layout/ResponsiveShell';
import { getCurrentSession } from '@/lib/auth/serverSession';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  return <ResponsiveShell currentUser={session}>{children}</ResponsiveShell>;
}
