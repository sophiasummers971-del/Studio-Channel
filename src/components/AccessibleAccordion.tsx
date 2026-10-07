import { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccessibleAccordionProps {
  id: string;
  expanded: boolean;
  onToggle: () => void;
  headerLabel: string;
  headerBadges?: ReactNode;
  children: ReactNode;
}

export function AccessibleAccordion({
  id,
  expanded,
  onToggle,
  headerLabel,
  headerBadges,
  children,
}: AccessibleAccordionProps) {
  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;

  return (
    <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl overflow-hidden">
      <div className="flex items-center">
        <button
          type="button"
          id={buttonId}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 px-4 py-3 text-left hover:bg-[#070b10] transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400"
        >
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform shrink-0 ${
              expanded ? 'rotate-0' : '-rotate-90'
            }`}
          />
          <span className="text-sm font-semibold text-slate-200">{headerLabel}</span>
          {headerBadges}
        </button>
      </div>
      {expanded && (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}
