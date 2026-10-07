interface AccessibleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
  color?: string;
}

export function AccessibleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  color = '#0EA5E9',
}: AccessibleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`w-11 h-6 rounded-full shrink-0 transition-all relative focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400 ${
        checked ? '' : 'bg-slate-200'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      style={checked ? { backgroundColor: color } : undefined}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#0b1118] shadow-sm transition-all ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}
