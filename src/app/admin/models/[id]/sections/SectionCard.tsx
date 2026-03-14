'use client';

import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  isDirty?: boolean;
  saving?: boolean;
  onSave?: () => void;
  children: ReactNode;
  headerRight?: ReactNode;
}

export default function SectionCard({ title, isDirty, saving, onSave, children, headerRight }: SectionCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {isDirty && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium disabled:opacity-50 transition-colors"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />}
              Save {title}
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
