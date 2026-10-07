import { useLinkedInSetup } from '@/hooks/useLinkedInSetup';
import { PLATFORMS } from '@/data/platforms';
import {
  Linkedin,
  Target,
  Layers,
  Zap,
  Clock,
  ClipboardCheck,
  FlaskConical,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar,
} from 'lucide-react';

const LINKEDIN_COLOR = '#0A66C2';

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  core: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Core' },
  supporting: { bg: 'bg-[#101820]', text: 'text-slate-400', label: 'Supporting' },
  experimental: { bg: 'bg-amber-400/[0.05]', text: 'text-amber-200/75', label: 'Experimental' },
};

const EFFORT_STYLES: Record<string, string> = {
  minimal: 'text-emerald-400',
  light: 'text-sky-600',
  moderate: 'text-amber-600',
};

const TEST_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-[#101820]', text: 'text-slate-500', label: 'Pending' },
  running: { bg: 'bg-cyan-400/[0.04]', text: 'text-sky-600', label: 'Running' },
  passed: { bg: 'bg-emerald-400/[0.045]', text: 'text-emerald-400', label: 'Passed' },
  failed: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Failed' },
};

const AUDIENCE_STYLES: Record<string, string> = {
  large: 'text-emerald-400',
  medium: 'text-amber-600',
  niche: 'text-slate-500',
};

const COMPETITION_STYLES: Record<string, string> = {
  high: 'text-rose-500',
  medium: 'text-amber-500',
  low: 'text-emerald-500',
};

export function LinkedInSetupView() {
  const {
    nicheOptions,
    selectedNiche,
    selectNiche,
    contentPillars,
    dailyFlow,
    reviewRhythm,
    growthTests,
    cycleTestStatus,
    completedTests,
    passedTests,
    monetizationPaths,
    weeklySchedule,
  } = useLinkedInSetup();

  const linkedinPlatform = PLATFORMS.find((p) => p.id === 'linkedin')!;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${LINKEDIN_COLOR}18` }}
          >
            <Linkedin size={22} style={{ color: LINKEDIN_COLOR }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">LinkedIn Channel Setup</h2>
            <p className="text-sm text-slate-500">
              A repeatable LinkedIn workflow for text posts and supporting content formats — designed to
              grow a stable professional audience baseline with minimal weekly approval overhead.
            </p>
          </div>
        </div>
      </div>

      {/* Goal Banner */}
      <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Goal</p>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
              Grow a stable professional audience baseline that could support a small passive income stream —
              through paid newsletters, digital products, and consulting leads. Keep the workflow lightweight
              enough to sustain alongside other channel work.
            </p>
          </div>
        </div>
      </div>

      {/* Niche Selection */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Best Niche Direction for LinkedIn</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {nicheOptions.map((niche) => {
            const isSelected = selectedNiche.id === niche.id;
            return (
              <button
                key={niche.id}
                onClick={() => selectNiche(niche.id)}
                aria-pressed={isSelected}
                className={`flex items-start gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-200'
                    : 'bg-[#0b1118] border-[#1b2935] hover:bg-[#070b10]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    isSelected ? 'bg-blue-500' : 'bg-[#0b1118] border-2 border-slate-300'
                  }`}
                >
                  {isSelected && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-100">{niche.label}</h4>
                    {niche.recommended && (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        <Sparkles size={10} />
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">{niche.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Users size={11} className="text-slate-400" />
                      <span className="text-slate-400">Audience:</span>
                      <span className={`font-medium ${AUDIENCE_STYLES[niche.audienceSize]}`}>
                        {niche.audienceSize}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Target size={11} className="text-slate-400" />
                      <span className="text-slate-400">Competition:</span>
                      <span className={`font-medium ${COMPETITION_STYLES[niche.competition]}`}>
                        {niche.competition}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={11} className="text-slate-400" />
                      <span className="text-slate-400">Monetization:</span>
                      <span className={`font-medium ${
                        niche.monetizationPotential === 'high'
                          ? 'text-emerald-400'
                          : niche.monetizationPotential === 'medium'
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}>
                        {niche.monetizationPotential}
                      </span>
                    </span>
                  </div>
                  {isSelected && (
                    <p className="text-xs text-blue-700 italic mt-2 leading-relaxed">
                      {niche.rationale}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Pillars */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Content Types to Prioritize</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {contentPillars.map((pillar) => {
            const style = PRIORITY_STYLES[pillar.priority];
            return (
              <div
                key={pillar.id}
                className="flex items-start gap-3 px-4 py-3 bg-[#0b1118] border border-[#1b2935] rounded-xl"
              >
                <div className="w-9 h-9 rounded-lg bg-[#101820] flex items-center justify-center shrink-0">
                  <Layers size={16} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-200">{pillar.label}</h4>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] text-slate-400">{pillar.frequency}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">{pillar.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pillar.exampleFormats.map((fmt, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#070b10] text-slate-500 border border-[#14202a]"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily AI-Generated Post Flow */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Daily AI-Generated Post Flow</h3>
        </div>
        <div className="relative">
          <div className="absolute left-[21px] top-2 bottom-2 w-px bg-slate-200" />
          <div className="space-y-2">
            {dailyFlow.map((step) => (
              <div key={step.id} className="flex items-start gap-3 relative">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 z-10 ${
                    step.automated ? 'bg-blue-100' : 'bg-[#101820]'
                  }`}
                >
                  {step.automated ? (
                    <Zap size={16} className="text-blue-600" />
                  ) : (
                    <Users size={16} className="text-slate-500" />
                  )}
                </div>
                <div className="flex-1 px-4 py-3 bg-[#0b1118] border border-[#1b2935] rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400">STEP {step.step}</span>
                    <h4 className="text-sm font-semibold text-slate-200">{step.label}</h4>
                    {step.automated ? (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                        Automated
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#101820] text-slate-500">
                        Manual
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={11} className="text-slate-400" />
                    <span className="text-[11px] text-slate-400">{step.timeWindow}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Posting Schedule */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Weekly Posting Schedule</h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#1b2935]">
          <table className="w-full text-sm">
            <caption className="sr-only">LinkedIn weekly posting schedule by day, content pillar, format, and time</caption>
            <thead>
              <tr className="bg-[#070b10] border-b border-[#1b2935]">
                <th scope="col" className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-4 py-2.5">Day</th>
                <th scope="col" className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-4 py-2.5">Content Pillar</th>
                <th scope="col" className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-4 py-2.5">Format</th>
                <th scope="col" className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-4 py-2.5">Time</th>
              </tr>
            </thead>
            <tbody>
              {weeklySchedule.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-[#14202a] last:border-b-0 ${i % 2 === 1 ? 'bg-[#070b10]/30' : ''}`}
                >
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-300">{row.day}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{row.pillar}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{row.format}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightweight Review & Approval Rhythm */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Lightweight Review & Approval Rhythm</h3>
          <span className="text-xs text-slate-400">Designed for minimal weekly overhead</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {reviewRhythm.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 px-4 py-3 bg-[#0b1118] border border-[#1b2935] rounded-xl"
            >
              <div className="w-9 h-9 rounded-lg bg-[#101820] flex items-center justify-center shrink-0">
                <ClipboardCheck size={16} className="text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-200">{item.label}</h4>
                  <span className={`text-[10px] font-medium ${EFFORT_STYLES[item.effort]}`}>
                    {item.effort} effort
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Clock size={11} />
                  {item.cadence}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simple Testing Approach */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-300">Simple Testing Approach for Growth</h3>
            <span className="text-xs text-slate-400">
              ({completedTests}/{growthTests.length} completed, {passedTests} passed)
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {growthTests.map((test) => {
            const style = TEST_STATUS_STYLES[test.status];
            return (
              <button
                key={test.id}
                onClick={() => cycleTestStatus(test.id)}
                aria-label={`${test.label} — status: ${style.label}. Click to change status.`}
                className="w-full flex items-start gap-3 px-4 py-3 bg-[#0b1118] border border-[#1b2935] rounded-xl text-left hover:bg-[#070b10] transition-all"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}
                >
                  {test.status === 'passed' ? (
                    <CheckCircle2 size={16} className={style.text} />
                  ) : test.status === 'failed' ? (
                    <Circle size={16} className={style.text} />
                  ) : (
                    <FlaskConical size={16} className={style.text} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-200">{test.label}</h4>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] text-slate-400">{test.targetWeek}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-1">{test.description}</p>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={11} className="text-slate-400" />
                    <span className="text-[11px] text-slate-400">Metric: </span>
                    <span className="text-[11px] font-medium text-slate-400">{test.metric}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-2 italic">
          Click any test to cycle its status. Run one test at a time — wait for results before starting the next.
        </p>
      </div>

      {/* Monetization Paths */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Monetization Paths for Passive Income</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {monetizationPaths.map((path) => (
            <div
              key={path.id}
              className="flex items-start gap-3 px-4 py-3 bg-[#0b1118] border border-[#1b2935] rounded-xl"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-400/[0.045] flex items-center justify-center shrink-0">
                <DollarSign size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-200">{path.label}</h4>
                  {path.passive && (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-400/[0.045] text-emerald-400">
                      <Sparkles size={10} />
                      Passive
                    </span>
                  )}
                  <span className={`text-[10px] font-medium ${
                    path.effort === 'low' ? 'text-emerald-400' : path.effort === 'medium' ? 'text-amber-600' : 'text-rose-500'
                  }`}>
                    {path.effort} effort
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{path.description}</p>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Target size={11} />
                  {path.threshold}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-[#1b2935] bg-[#070b10] p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
            <Linkedin size={20} className="text-slate-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300">Setup Summary</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Niche: <span className="font-medium text-slate-300">{selectedNiche.label}</span>.
              Post 6-7 times per week across core and supporting pillars. The AI generates a brief,
              draft, and posting plan each morning — you review and schedule. Keep the approval pass
              light: a daily read-through and one weekly batch review. Run growth tests every two
              weeks and scale what works. Monetization starts with consulting and scales to
              courses and sponsored content as the audience grows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}