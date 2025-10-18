type AdSlotProps = {
  label: string;
  dimensions: string;
  className?: string;
};

const AdSlot = ({ label, dimensions, className }: AdSlotProps) => (
  <div
    className={`flex items-center justify-center rounded border border-dashed border-slate-300 bg-white text-xs text-slate-500 ${className ?? ""}`}
    aria-label={label}
  >
    <div className="text-center leading-tight">
      <p className="font-semibold">{label}</p>
      <p>{dimensions}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide">Ad Placeholder</p>
    </div>
  </div>
);

export default AdSlot;
