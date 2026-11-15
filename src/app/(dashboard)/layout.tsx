import ResponsiveShell from '@/components/layout/ResponsiveShell';
import { getCurrentSession } from '@/lib/auth/serverSession';
import { getPendingDepositRequestsCount } from '@/lib/data/storeDeposit';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  const canSeeDepositNotif =
    !!session &&
    (!!session.permissions?.kas_manage ||
      !!session.permissions?.closing_manage ||
      session.role === 'bendahara' ||
      session.role === 'superadmin');

  const pendingDepositCount = canSeeDepositNotif ? getPendingDepositRequestsCount() : 0;

  return (
    <ResponsiveShell currentUser={session} pendingDepositCount={pendingDepositCount}>
      {children}
    </ResponsiveShell>
  );
}
