import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/serverSession';
import { getDefaultHomeForSession } from '@/lib/auth/session';

export default async function HomePage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/login');
  }
  redirect(getDefaultHomeForSession(session));
}
