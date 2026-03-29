import { useState, useEffect, useRef } from 'react';
import { getSlaStatus, getTimeRemaining, formatTimeRemaining } from '@/utils/sla';
import type { SlaStatus } from '@/utils/sla';

const STATUS_COLORS: Record<SlaStatus, string> = {
  ok: '#16a34a',
  warning: '#ca8a04',
  breached: '#dc2626',
};

const STATUS_LABELS: Record<SlaStatus, string> = {
  ok: 'Dentro do prazo',
  warning: 'Prazo próximo',
  breached: 'Prazo expirado',
};

interface SlaCountdownProps {
  deadline: string;
}

function SlaCountdown({ deadline }: SlaCountdownProps) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(deadline));
  const [status, setStatus] = useState(() => getSlaStatus(deadline));
  const prevStatusRef = useRef(status);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(deadline));
      setStatus(getSlaStatus(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  // Only announce via aria-live when status category changes (ok→warning→breached)
  const statusChanged = prevStatusRef.current !== status;
  useEffect(() => {
    prevStatusRef.current = status;
  }, [status]);

  return (
    <span
      style={{ color: STATUS_COLORS[status], fontWeight: 600, fontSize: '0.8125rem' }}
      aria-label={`SLA: ${STATUS_LABELS[status]} — ${formatTimeRemaining(remaining)}`}
      aria-live={statusChanged ? 'polite' : 'off'}
    >
      {formatTimeRemaining(remaining)}
    </span>
  );
}

export { SlaCountdown };
