import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  SessionPayload,
  verifySessionToken,
} from './session';

export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
