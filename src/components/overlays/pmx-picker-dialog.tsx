"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PmxPickerDialog({
  paths,
  selected,
  onSelect,
  onConfirm,
  onDismiss,
}: {
  paths: string[]
  selected: string
  onSelect: (path: string) => void
  onConfirm: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pmx-picker-title"
        className="relative z-[1] w-full max-w-md rounded-xl border border-white/10 bg-zinc-950/85 p-5 text-white shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 id="pmx-picker-title" className="text-sm font-semibold tracking-tight">
            Multiple .pmx files in folder
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-mr-1 -mt-1 size-7 shrink-0 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close"
            onClick={onDismiss}
          >
            <X className="size-4" />
          </Button>
        </div>
        <p className="mb-4 text-xs text-white/60">Pick which model to load.</p>
        <select
          className="mb-5 w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-white/20"
          value={selected}
          onChange={(ev) => onSelect(ev.target.value)}
        >
          {paths.map((p) => (
            <option key={p} value={p} className="bg-zinc-900 text-white">
              {p}
            </option>
          ))}
        </select>
        <div className="flex flex-row justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-white/70 hover:bg-white/10 hover:text-white"
            onClick={onDismiss}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 bg-white text-xs text-black hover:bg-white/90"
            onClick={onConfirm}
          >
            Load selected
          </Button>
        </div>
      </div>
    </div>
  )
}
