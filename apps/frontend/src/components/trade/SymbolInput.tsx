import React from 'react';

export default function SymbolInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-slate-500">Symbol (e.g., <b>TATAPOWER</b> not <b>TATA POWER</b>)</label>
      <input 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full rounded-lg border px-3 py-2"
        placeholder="e.g., TATAMOTORS" 
      />
    </div>
  );
}
