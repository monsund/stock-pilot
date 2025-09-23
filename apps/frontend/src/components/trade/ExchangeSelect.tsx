import React from 'react';

export const EXCHANGES = [
  { value: 'NSE', label: 'NSE' },
  { value: 'BSE', label: 'BSE' },
  // Add more exchanges as needed
];

export default function ExchangeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-slate-500">Exchange</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="rounded-lg border px-3 py-2 w-full sm:w-32">
        {EXCHANGES.map(ex => (
          <option key={ex.value} value={ex.value}>{ex.label}</option>
        ))}
      </select>
    </div>
  );
}
