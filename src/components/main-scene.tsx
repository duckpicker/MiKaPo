"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import {
  Engine,
  type AnimationClip,
  MaterialPresetMap,
  Model,
  Quat,
  Vec3,
  parsePmxFolderInput,
  pmxFileAtRelativePath,
} from "reze-engine"

import { MotionCapture } from "./motion-capture"
import Loading from "./loading"
import { Header } from "./layout/header"
import { PmxPickerDialog } from "./overlays/pmx-picker-dialog"
import { useEngine } from "@/hooks/useEngine"
import { useModelLoader } from "@/hooks/useModelLoader"
import { ConfigurationModule } from "@/configuration"
import { Solver } from "@/lib/solver"
import { FaceBlendshapeSolver } from "@/lib/face-blendshape-solver"
import type { BoneState } from "@/types/solver"
import type { FaceSolverResult } from "@/types/face"
import { BoneGroup } from "@/configuration/types"
import { filterBoneDefs } from "@/configuration/bone-filter"

const DEFAULT_MODEL_KEY = "mikapo"
const EXPORT_CLIP_NAME = "mikapo-capture"
const NO = ["false", "0", "off", "no"]
const USE_DEFAULT_ASSETS = !NO.includes((process.env.NEXT_PUBLIC_USE_DEFAULT_ASSETS ?? "").trim().toLowerCase())

const DEFAULT_STYLE_OVERRIDES: MaterialPresetMap = {
  eye: ["眼睛", "眼白", "目白", "右瞳", "左瞳", "眉毛", "eyebrow", "eyelash"],
  face: ["脸", "face01"],
  body: ["皮肤", "skin"],
  hair: ["头发", "hair_f"],
  cloth_smooth: [
    "衣服",
    "裙子",
    "裙带",
    "裙布",
    "外套",
    "外套饰",
    "裤子",
    "裤子0",
    "腿环",
    "发饰",
    "鞋子",
    "鞋子饰",
    "shirt",
    "shoes",
    "shorts",
    "trigger",
    "dress",
    "hair_accessory",
    "cloth01_shoes",
  ],
  stockings: ["袜子", "stockings"],
  metal: ["metal01", "earring"],
}

function fileStem(filename: string) {
  const i = filename.lastIndexOf(".")
  return i >= 0 ? filename.slice(0, i) : filename
}

export default function MainScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { engineRef, engineInited, stats, initEngine: initEngineBase, dispose } = useEngine()
  const { modelRef, loadGenerationRef, modelLoaded, setModelLoaded, restPose, colliders, modelMorphs, buildRestPose } =
    useModelLoader()

  const loadedModelNameRef = useRef(DEFAULT_MODEL_KEY)
  const pmxFolderInputRef = useRef<HTMLInputElement>(null)
  const configRef = useRef(ConfigurationModule.load())
  const solverRef = useRef<Solver | null>(null)
  const faceSolverRef = useRef<FaceBlendshapeSolver | null>(null)

  const [mediaPipeReady, setMediaPipeReady] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [pmxPickFiles, setPmxPickFiles] = useState<File[] | null>(null)
  const [pmxPickPaths, setPmxPickPaths] = useState<string[]>([])
  const [pmxPickSelected, setPmxPickSelected] = useState("")

  const pmxPickDialogOpen = Boolean(pmxPickFiles && pmxPickPaths.length > 1)

  const followModel = useCallback(
    (model: Model) => {
      engineRef.current?.setCameraFollow(model, "センター", new Vec3(0, 3, 0), 0.15)
    },
    [engineRef],
  )

  const initEngine = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      await initEngineBase(canvasRef.current)
      const engine = engineRef.current!
      configRef.current.applyToScene(engine)
      configRef.current.save()

      if (!USE_DEFAULT_ASSETS) {
        return
      }

      const genBefore = loadGenerationRef.current
      try {
        const model = await engine.loadModel(DEFAULT_MODEL_KEY, "/models/塞尔凯特/塞尔凯特.pmx")
        if (genBefore !== loadGenerationRef.current) {
          try {
            engine.removeModel(DEFAULT_MODEL_KEY)
          } catch {}
          return
        }
        modelRef.current = model
        loadedModelNameRef.current = DEFAULT_MODEL_KEY
        await engine.autoStyleGroups(DEFAULT_MODEL_KEY, DEFAULT_STYLE_OVERRIDES)
        setModelLoaded(true)
        if (solverRef.current) configRef.current.applyToSolver(solverRef.current)
        await new Promise((r) => requestAnimationFrame(r))
        buildRestPose(model)
        followModel(model)
        setEngineError(null)
      } catch (loadErr) {
        setEngineError(loadErr instanceof Error ? loadErr.message : "Unknown error")
      }
    } catch (error) {
      setEngineError(error instanceof Error ? error.message : "Unknown error")
    }
  }, [
    initEngineBase,
    buildRestPose,
    followModel,
    engineRef,
    modelRef,
    loadGenerationRef,
    setModelLoaded,
    solverRef,
    configRef,
  ])

  useEffect(() => {
    initEngine()
    return () => dispose()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPmxFromFolder = useCallback(
    async (files: File[], pmxFile: File) => {
      const engine = engineRef.current
      if (!engine) {
        window.alert("Viewport is not ready yet.")
        return
      }
      loadGenerationRef.current += 1
      const stem = fileStem(pmxFile.name)
      const instanceKey = `u_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
      try {
        try {
          engine.removeModel(loadedModelNameRef.current)
        } catch {}
        const model = await engine.loadModel(instanceKey, { files, pmxFile })
        await new Promise((r) => requestAnimationFrame(r))
        model.setName(stem)
        modelRef.current = model
        loadedModelNameRef.current = instanceKey
        await engine.autoStyleGroups(instanceKey, DEFAULT_STYLE_OVERRIDES)
        setModelLoaded(true)
        buildRestPose(model)
        followModel(model)
        setEngineError(null)
      } catch (e) {
        console.error("[pmx-upload]", e)
        window.alert(e instanceof Error ? e.message : String(e))
      }
    },
    [engineRef, modelRef, loadGenerationRef, setModelLoaded, buildRestPose, followModel],
  )

  const onPickPmxFolder = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const picked = parsePmxFolderInput(e.target.files)
        e.target.value = ""
        if (picked.status === "empty" || picked.status === "not_directory" || picked.status === "no_pmx") {
          const msgs = {
            not_directory: "Please select a folder, not individual files.",
            no_pmx: "No .pmx file in the selected folder.",
          }
          if (picked.status !== "empty") window.alert(msgs[picked.status])
          return
        }
        setPmxPickFiles(null)
        setPmxPickPaths([])
        setPmxPickSelected("")
        if (picked.status === "single") await loadPmxFromFolder(picked.files, picked.pmxFile)
        else {
          setPmxPickFiles(picked.files)
          setPmxPickPaths(picked.pmxRelativePaths)
          setPmxPickSelected(picked.pmxRelativePaths[0] ?? "")
        }
      } catch (err) {
        console.error("[pmx-folder]", err)
        window.alert(err instanceof Error ? err.message : String(err))
      }
    },
    [loadPmxFromFolder],
  )

  const onConfirmPmxPick = useCallback(async () => {
    if (!pmxPickFiles || !pmxPickSelected) return
    const pmxFile = pmxFileAtRelativePath(pmxPickFiles, pmxPickSelected)
    if (!pmxFile) {
      window.alert("Could not find the selected PMX file.")
      return
    }
    await loadPmxFromFolder(pmxPickFiles, pmxFile)
    setPmxPickFiles(null)
    setPmxPickPaths([])
    setPmxPickSelected("")
  }, [loadPmxFromFolder, pmxPickFiles, pmxPickSelected])

  const applyPose = useCallback(
    (boneStates: BoneState[], tweenMs = 30) => {
      const model = modelRef.current
      if (!model) return
      const pose: Record<string, Quat> = {}
      const moves: Record<string, Vec3> = {}
      for (const bone of boneStates) {
        pose[bone.name] = new Quat(bone.rotation.x, bone.rotation.y, bone.rotation.z, bone.rotation.w)
        if (bone.translation) moves[bone.name] = new Vec3(bone.translation.x, bone.translation.y, bone.translation.z)
      }
      if (Object.keys(pose).length > 0) model.rotateBones(pose, tweenMs)
      if (Object.keys(moves).length > 0) model.moveBones(moves, tweenMs)
    },
    [modelRef],
  )

  const applyFace = useCallback(
    (faceResult: FaceSolverResult, tweenMs = 30) => {
      const model = modelRef.current
      if (!model) return
      if (faceResult.boneStates.length > 0) {
        const pose: Record<string, Quat> = {}
        for (const bone of faceResult.boneStates)
          pose[bone.name] = new Quat(bone.rotation.x, bone.rotation.y, bone.rotation.z, bone.rotation.w)
        model.rotateBones(pose, tweenMs)
      }
      for (const [name, weight] of Object.entries(faceResult.morphWeights)) model.setMorphWeight(name, weight, tweenMs)
    },
    [modelRef],
  )

  const resetModel = useCallback(() => {
    modelRef.current?.resetAllBones()
    modelRef.current?.resetAllMorphs()
  }, [modelRef])

  const exportVmd = useCallback(
    (clip: AnimationClip) => {
      const model = modelRef.current
      if (!model || clip.frameCount === 0) return
      model.loadClip(EXPORT_CLIP_NAME, clip)
      const buffer = model.exportVmd(EXPORT_CLIP_NAME)
      const url = URL.createObjectURL(new Blob([buffer], { type: "application/octet-stream" }))
      const a = document.createElement("a")
      a.href = url
      a.download = `mikapo-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.vmd`
      a.click()
      URL.revokeObjectURL(url)
    },
    [modelRef],
  )

  useEffect(() => {
    if (!pmxPickDialogOpen) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setPmxPickFiles(null)
        setPmxPickPaths([])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [pmxPickDialogOpen])

  return (
    <div className="w-full h-full">
      <input
        ref={pmxFolderInputRef}
        type="file"
        className="fixed right-0 top-0 -z-10 h-px w-px opacity-0"
        multiple
        {...({ webkitdirectory: "", mozdirectory: "" } as any)}
        onChange={onPickPmxFolder}
      />

      <Header stats={stats} engineInited={engineInited} onOpenFolder={() => pmxFolderInputRef.current?.click()} />

      {pmxPickDialogOpen && (
        <PmxPickerDialog
          paths={pmxPickPaths}
          selected={pmxPickSelected}
          onSelect={setPmxPickSelected}
          onConfirm={() => {
            void onConfirmPmxPick()
          }}
          onDismiss={() => {
            setPmxPickFiles(null)
            setPmxPickPaths([])
          }}
        />
      )}

      <MotionCapture
        applyPose={applyPose}
        applyFace={applyFace}
        modelLoaded={modelLoaded}
        onMediaPipeReadyChange={setMediaPipeReady}
        resetModel={resetModel}
        restPose={restPose}
        colliders={colliders}
        modelMorphs={modelMorphs}
        exportVmd={exportVmd}
        configModule={configRef.current}
        onSolverReady={(s) => {
          solverRef.current = s
          configRef.current.applyToSolver(s)
        }}
        onFaceSolverReady={(f) => {
          faceSolverRef.current = f
        }}
        engineRef={engineRef}
        modelRef={modelRef}
      />

      {engineError ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-red-400/20 bg-zinc-950/90 px-5 py-4 text-center text-sm leading-relaxed text-red-300 shadow-2xl shadow-black/40 backdrop-blur-md">
            {engineError}
          </div>
        </div>
      ) : (
        <Loading modelLoaded={modelLoaded} mediaPipeReady={mediaPipeReady} />
      )}

      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-1 outline-none" />
    </div>
  )
}
