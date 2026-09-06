const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  UNKNOWN: 'bg-gray-50 text-gray-600 border-gray-200',
};

const RISK_LEVEL_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-800 border-red-300',
  HIGH: 'bg-orange-50 text-orange-800 border-orange-300',
  MEDIUM: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  LOW: 'bg-green-50 text-green-800 border-green-300',
};

interface SeverityBadgeProps {
  severity: string;
  variant?: 'default' | 'risk';
}

export function SeverityBadge({ severity, variant = 'default' }: SeverityBadgeProps) {
  const styles = variant === 'risk' ? RISK_LEVEL_STYLES : SEVERITY_STYLES;
  const className = styles[severity] || styles.UNKNOWN;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded ${className}`}
    >
      {severity}
    </span>
  );
}
