export type LightStatus = 'ok' | 'fault' | 'assigned';

export const STATUS_COLORS: Record<LightStatus, { pin: string; bg: string; text: string }> = {
  ok:       { pin: '#1A7F4E', bg: '#D4F4E6', text: '#1A7F4E' },
  fault:    { pin: '#C05000', bg: '#FFF0E0', text: '#C05000' },
  assigned: { pin: '#0055AA', bg: '#EBF4FF', text: '#0055AA' },
};
