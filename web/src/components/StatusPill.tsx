import { STATUS_COLORS, LightStatus } from '../lib/statusColors';

interface Props {
  status: LightStatus;
}

export default function StatusPill({ status }: Props) {
  const { bg, text } = STATUS_COLORS[status];
  return (
    <span className="status-pill" style={{ background: bg, color: text }}>
      {status}
    </span>
  );
}
