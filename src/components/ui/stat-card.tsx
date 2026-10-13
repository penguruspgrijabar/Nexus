import { Icon, type IconName } from "@/components/icons";
import type { Tone } from "@/components/ui/primitives";

/**
 * Kartu metrik: label, nilai besar dengan angka tabular, dan ikon berwarna
 * sebagai penanda jenis data (bukan hiasan).
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: IconName;
  tone?: Tone;
}) {
  return (
    <div className="stat">
      <div className="stat-head">
        <span className="stat-label">{label}</span>
        {icon && (
          <span className="stat-icon" data-tone={tone}>
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
