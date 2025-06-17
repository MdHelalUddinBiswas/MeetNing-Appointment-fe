import { cookies } from 'next/headers';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

async function getCookieValue(store: CookieStore, key: string): Promise<string | undefined> {
  const cookie = store.get(key);
  return cookie?.value;
}

export async function getToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return await getCookieValue(cookieStore, 'token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return undefined;
  }
}

export async function getTimezone(): Promise<string> {
  try {
    const cookieStore = await cookies();
    return (await getCookieValue(cookieStore, 'timezone')) || 'UTC';
  } catch (error) {
    console.error('Error getting timezone:', error);
    return 'UTC';
  }
}
