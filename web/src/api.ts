// Paths are prefixed with /api so the Vite proxy can match them without
// colliding with React Router paths on page refresh.
const API_KEY = (import.meta.env['VITE_APP_PASSWORD'] as string | undefined) ?? '';

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  });
}
