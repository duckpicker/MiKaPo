"use client"

const FOLLOW_BONES: { label: string; value: string }[] = [
  { label: "Center (Root)", value: "センター" },
  { label: "Head", value: "頭" },
  { label: "Neck", value: "首" },
  { label: "Upper Chest", value: "上半身" },
  { label: "Upper Chest 2", value: "上半身2" },
  { label: "All Parents (Master)", value: "全ての親" },
]

interface SettingsPanelProps {
  camera: { distance: number; followBone: string; followSmoothing: number; offsetY: number }
  onCameraChange: (
    c: Partial<{ distance: number; followBone: string; followSmoothing: number; offsetY: number }>,
  ) => void
  background: { r: number; g: number; b: number } | null
  onBackgroundChange: (bg: { r: number; g: number; b: number } | null) => void
  sun: {
    direction: { x: number; y: number; z: number }
    strength: number
    color: { r: number; g: number; b: number }
  }
  onSunChange: (
    s: Partial<{
      direction: { x: number; y: number; z: number }
      strength: number
      color: { r: number; g: number; b: number }
    }>,
  ) => void
  world: { strength: number; color: { r: number; g: number; b: number } }
  onWorldChange: (w: Partial<{ strength: number; color: { r: number; g: number; b: number } }>) => void
  smoothing: { minCutoff: number; beta: number; dCutoff: number }
  onSmoothingChange: (s: Partial<{ minCutoff: number; beta: number; dCutoff: number }>) => void
}

function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[10px] text-white/50">
        <span>{label}</span>
        <span className="tabular-nums">{typeof value === "number" ? value.toFixed(2) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 accent-white"
      />
    </div>
  )
}

function ColorPicker({
  label,
  color,
  onChange,
}: {
  label: string
  color: { r: number; g: number; b: number }
  onChange: (c: { r: number; g: number; b: number }) => void
}) {
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0")
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/50 w-16 shrink-0">{label}</span>
      <input
        type="color"
        value={`#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`}
        onChange={(e) => {
          const h = e.target.value
          onChange({
            r: parseInt(h.slice(1, 3), 16) / 255,
            g: parseInt(h.slice(3, 5), 16) / 255,
            b: parseInt(h.slice(5, 7), 16) / 255,
          })
        }}
        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
      />
    </div>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-white"
      />
      {label}
    </label>
  )
}

export function SettingsPanel({
  camera,
  onCameraChange,
  background,
  onBackgroundChange,
  sun,
  onSunChange,
  world,
  onWorldChange,
  smoothing,
  onSmoothingChange,
}: SettingsPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Camera</span>
        <Slider
          label="Distance"
          value={camera.distance}
          min={5}
          max={50}
          onChange={(v) => onCameraChange({ distance: v })}
        />
        <Slider
          label="Offset Y"
          value={camera.offsetY}
          min={-5}
          max={10}
          onChange={(v) => onCameraChange({ offsetY: v })}
        />
        <Slider
          label="Smoothing"
          value={camera.followSmoothing}
          min={0}
          max={0.5}
          step={0.01}
          onChange={(v) => onCameraChange({ followSmoothing: v })}
        />
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/50 w-16 shrink-0">Follow</span>
          <select
            value={camera.followBone}
            onChange={(e) => onCameraChange({ followBone: e.target.value })}
            className="flex-1 rounded bg-white/5 border border-white/10 text-xs text-white px-1.5 py-1 outline-none"
          >
            {FOLLOW_BONES.map((b) => (
              <option key={b.value} value={b.value} className="bg-zinc-900">
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Background</span>
        <Check
          label="Enabled"
          checked={background !== null}
          onChange={(v) => onBackgroundChange(v ? { r: 0, g: 0.69, b: 0.14 } : null)}
        />
        {background && <ColorPicker label="Color" color={background} onChange={onBackgroundChange} />}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Sun</span>
        <Slider label="Strength" value={sun.strength} min={0} max={10} onChange={(v) => onSunChange({ strength: v })} />
        <ColorPicker label="Color" color={sun.color} onChange={(c) => onSunChange({ color: c })} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-white/50">Direction</span>
          <div className="grid grid-cols-3 gap-1">
            <div className="text-[9px] text-white/40 text-center">X</div>
            <div className="text-[9px] text-white/40 text-center">Y</div>
            <div className="text-[9px] text-white/40 text-center">Z</div>
            <input
              type="number"
              value={sun.direction.x}
              step={0.05}
              min={-1}
              max={1}
              onChange={(e) => onSunChange({ direction: { ...sun.direction, x: Number(e.target.value) } })}
              className="w-full rounded bg-white/5 border border-white/10 text-[10px] text-white px-1 py-0.5 text-center outline-none"
            />
            <input
              type="number"
              value={sun.direction.y}
              step={0.05}
              min={-1}
              max={1}
              onChange={(e) => onSunChange({ direction: { ...sun.direction, y: Number(e.target.value) } })}
              className="w-full rounded bg-white/5 border border-white/10 text-[10px] text-white px-1 py-0.5 text-center outline-none"
            />
            <input
              type="number"
              value={sun.direction.z}
              step={0.05}
              min={-1}
              max={1}
              onChange={(e) => onSunChange({ direction: { ...sun.direction, z: Number(e.target.value) } })}
              className="w-full rounded bg-white/5 border border-white/10 text-[10px] text-white px-1 py-0.5 text-center outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Ambient</span>
        <Slider
          label="Strength"
          value={world.strength}
          min={0}
          max={2}
          onChange={(v) => onWorldChange({ strength: v })}
        />
        <ColorPicker label="Color" color={world.color} onChange={(c) => onWorldChange({ color: c })} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Smoothing</span>
        <Slider
          label="Min Cutoff"
          value={smoothing.minCutoff}
          min={0.1}
          max={5}
          onChange={(v) => onSmoothingChange({ minCutoff: v })}
        />
        <Slider
          label="Beta"
          value={smoothing.beta}
          min={0.1}
          max={5}
          onChange={(v) => onSmoothingChange({ beta: v })}
        />
        <Slider
          label="dCutoff"
          value={smoothing.dCutoff}
          min={0.5}
          max={10}
          onChange={(v) => onSmoothingChange({ dCutoff: v })}
        />
      </div>
    </div>
  )
}
