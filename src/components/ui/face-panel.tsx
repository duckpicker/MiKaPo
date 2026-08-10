"use client"

interface FacePanelProps {
  enabled: boolean
  onEnabledChange: (on: boolean) => void
  morphs: { blink: boolean; wink: boolean; mouth: boolean; smile: boolean }
  onMorphChange: (m: Partial<{ blink: boolean; wink: boolean; mouth: boolean; smile: boolean }>) => void
  thresholds: { eyeOpen: number; eyeClosed: number; mouthOpen: number; smile: number }
  onThresholdChange: (t: Partial<{ eyeOpen: number; eyeClosed: number; mouthOpen: number; smile: number }>) => void
  smoothing: { eyes: number; mouth: number; smile: number }
  onSmoothingChange: (s: Partial<{ eyes: number; mouth: number; smile: number }>) => void
  gaze: { enabled: boolean; strength: number }
  onGazeChange: (g: Partial<{ enabled: boolean; strength: number }>) => void
}

function Slider({
    label, value, min = 0, max = 1, step = 0.01, onChange,
  }: {
  label: string; value: number; min?: number; max?: number; step?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[10px] text-white/50">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={e => onChange(Number(e.target.value))} className="h-1 accent-white" />
    </div>
  )
}

function Check({
    label, checked, onChange,
  }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="size-3.5 accent-white" />
      {label}
    </label>
  )
}

export function FacePanel({
    enabled, onEnabledChange,
    morphs, onMorphChange,
    thresholds, onThresholdChange,
    smoothing, onSmoothingChange,
    gaze, onGazeChange,
  }: FacePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <Check label="Enable face tracking" checked={enabled} onChange={onEnabledChange} />

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Morphs</span>
        <Check label="Blink" checked={morphs.blink} onChange={v => onMorphChange({ blink: v })} />
        <Check label="Wink" checked={morphs.wink} onChange={v => onMorphChange({ wink: v })} />
        <Check label="Mouth" checked={morphs.mouth} onChange={v => onMorphChange({ mouth: v })} />
        <Check label="Smile" checked={morphs.smile} onChange={v => onMorphChange({ smile: v })} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Thresholds</span>
        <Slider label="Mouth Open" value={thresholds.mouthOpen} min={0.05} max={0.5} onChange={v => onThresholdChange({ mouthOpen: v })} />
        <Slider label="Smile" value={thresholds.smile} min={0.001} max={0.05} step={0.001} onChange={v => onThresholdChange({ smile: v })} />
        <Slider label="Eye Open" value={thresholds.eyeOpen} min={0.1} max={0.6} onChange={v => onThresholdChange({ eyeOpen: v })} />
        <Slider label="Eye Closed" value={thresholds.eyeClosed} min={0.01} max={0.3} onChange={v => onThresholdChange({ eyeClosed: v })} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Smoothing</span>
        <Slider label="Eyes" value={smoothing.eyes} onChange={v => onSmoothingChange({ eyes: v })} />
        <Slider label="Mouth" value={smoothing.mouth} onChange={v => onSmoothingChange({ mouth: v })} />
        <Slider label="Smile" value={smoothing.smile} onChange={v => onSmoothingChange({ smile: v })} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Gaze</span>
        <Check label="Enable gaze tracking" checked={gaze.enabled} onChange={v => onGazeChange({ enabled: v })} />
        <Slider label="Strength" value={gaze.strength} onChange={v => onGazeChange({ strength: v })} />
      </div>
    </div>
  )
}