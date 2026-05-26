const SESSION_KEY = 'slt_authed';

export function checkPassword(input: string): boolean {
  const expected = import.meta.env['VITE_APP_PASSWORD'] as string | undefined;
  if (!expected) return false;
  return input === expected;
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function setAuthenticated(): void {
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function clearAuthenticated(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
