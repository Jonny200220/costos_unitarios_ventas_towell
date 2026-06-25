import { useState } from 'react';

export function WeightSelector({ value, onChange, activeColor }: {
  value: number;
  onChange: (v: number) => void;
  activeColor: string;
}) {
  return (
    <div className="flex gap-0.5 justify-center">
      {([1, 2, 3, 4] as const).map(v => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={[
            'w-6 h-6 rounded text-xs font-bold transition-colors',
            value === v
              ? `${activeColor} text-white shadow-sm`
              : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20',
          ].join(' ')}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export function TiempoInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);

  const display = focused ? raw : value.toFixed(1);

  return (
    <div className="flex items-center gap-1 justify-center">
      <input
        type="number"
        min="0.1"
        step="0.1"
        value={display}
        className="w-14 h-6 rounded border border-input bg-background px-1.5 text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-[#1e2a5e]/50"
        onFocus={() => { setRaw(value.toFixed(1)); setFocused(true); }}
        onChange={e => setRaw(e.target.value)}
        onBlur={() => {
          setFocused(false);
          const n = parseFloat(raw);
          if (!isNaN(n) && n > 0) onChange(Math.round(n * 10) / 10);
        }}
      />
      <span className="text-[10px] text-muted-foreground">min</span>
    </div>
  );
}
