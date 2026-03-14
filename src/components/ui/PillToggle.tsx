'use client';

interface PillToggleProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
}

export default function PillToggle({ options, selected, onChange, multiple = true }: PillToggleProps) {
  function toggle(option: string) {
    if (multiple) {
      if (selected.includes(option)) {
        onChange(selected.filter(s => s !== option));
      } else {
        onChange([...selected, option]);
      }
    } else {
      onChange(selected.includes(option) ? [] : [option]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-full px-3.5 py-1.5 text-sm cursor-pointer transition-colors ${
              isSelected
                ? 'border-[1.5px] border-[#c9a96e] bg-[rgba(201,169,110,0.1)] text-[#c9a96e]'
                : 'border border-zinc-600 bg-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
