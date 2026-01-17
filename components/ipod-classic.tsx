"use client"

import { useReducer, useRef, useCallback, useState, useEffect } from "react"
import { Settings, Box, Share, Monitor, Smartphone, Check, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { exportImage, type ExportStatus } from "@/lib/export-utils"
import { IconButton } from "./icon-button"
import { ThreeDIpod } from "./three-d-ipod"
import { IpodScreen } from "./ipod-screen"
import { ClickWheel } from "./click-wheel"
import type { SongMetadata } from "../types/ipod"

// Base64 click sound
const CLICK_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//oeBAAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBBEAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBCEAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBDEAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBEIAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r////////////////////////////////////////////////////////////////"

const initialState: SongMetadata = {
  title: "Have A Destination?",
  artist: "Mac Miller",
  album: "Balloonerism",
  artwork: "/placeholder-logo.png",
  duration: 334,
  currentTime: 0,
  rating: 5,
  trackNumber: 2,
  totalTracks: 10,
}

type Action =
  | { type: "UPDATE_TITLE"; payload: string }
  | { type: "UPDATE_ARTIST"; payload: string }
  | { type: "UPDATE_ALBUM"; payload: string }
  | { type: "UPDATE_ARTWORK"; payload: string }
  | { type: "UPDATE_CURRENT_TIME"; payload: number }
  | { type: "UPDATE_DURATION"; payload: number }
  | { type: "UPDATE_RATING"; payload: number }
  | { type: "UPDATE_TRACK_NUMBER"; payload: number }
  | { type: "UPDATE_TOTAL_TRACKS"; payload: number }

function songReducer(state: SongMetadata, action: Action): SongMetadata {
  switch (action.type) {
    case "UPDATE_TITLE":
      return { ...state, title: action.payload }
    case "UPDATE_ARTIST":
      return { ...state, artist: action.payload }
    case "UPDATE_ALBUM":
      return { ...state, album: action.payload }
    case "UPDATE_ARTWORK":
      return { ...state, artwork: action.payload }
    case "UPDATE_CURRENT_TIME":
      return { ...state, currentTime: Math.max(0, Math.min(action.payload, state.duration)) }
    case "UPDATE_DURATION":
      return {
        ...state,
        duration: action.payload,
        currentTime: Math.min(state.currentTime, action.payload),
      }
    case "UPDATE_RATING":
      return { ...state, rating: action.payload }
    case "UPDATE_TRACK_NUMBER":
      return { ...state, trackNumber: Math.max(1, Math.min(action.payload, state.totalTracks)) }
    case "UPDATE_TOTAL_TRACKS":
      return { ...state, totalTracks: Math.max(1, action.payload) }
    default:
      return state
  }
}

export default function IPodClassic() {
  const [state, dispatch] = useReducer(songReducer, initialState)
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle")

  // View State: 'flat' (Standard 2D), '3d' (R3F), 'focus' (Close-up)
  const [viewMode, setViewMode] = useState<"flat" | "3d" | "focus">("flat")

  // Customization State
  const [skinColor, setSkinColor] = useState("#F5F5F7")
  const [bgColor, setBgColor] = useState("#E5E5E5")
  const [showSettings, setShowSettings] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const ipodRef = useRef<HTMLDivElement>(null)
  const exportTargetRef = useRef<HTMLDivElement>(null) // Wrapper for export
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Mouse Tracking (Standard Modes)
  useEffect(() => {
    // Only used for parallax which we might keep or remove, but keeping straightforward for now
  }, [viewMode])

  useEffect(() => {
    audioRef.current = new Audio(CLICK_SOUND)
  }, [])

  const playClick = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => { })
    }
  }, [])

  const handleSeek = useCallback((direction: number) => {
    dispatch({
      type: "UPDATE_CURRENT_TIME",
      payload: state.currentTime + (direction * 5)
    })
  }, [state.currentTime])

  const handleExport = useCallback(async () => {
    if (!exportTargetRef.current) return
    if (exportStatus !== "idle") return // Prevent double-clicks

    playClick()
    const filename = `ipod-${state.title.toLowerCase().replace(/\s+/g, "-")}.png`

    const result = await exportImage(exportTargetRef.current, {
      filename,
      backgroundColor: bgColor,
      pixelRatio: 4,
      onStatusChange: setExportStatus,
    })

    if (result.success) {
      if (result.method === "share") {
        toast.success("Shared successfully!", {
          description: "Use 'Save Image' in the share sheet to save to Photos",
        })
      } else {
        toast.success("Image exported!")
      }
    } else {
      toast.error("Export failed", {
        description: result.error,
        action: {
          label: "Retry",
          onClick: handleExport,
        },
      })
    }

    // Reset to idle after a brief delay to show success state
    setTimeout(() => setExportStatus("idle"), 1500)
  }, [playClick, state.title, bgColor, exportStatus])

  const screenComponent = (
    <IpodScreen
      state={state}
      dispatch={dispatch}
      playClick={playClick}
    />
  )

  const wheelComponent = (
    <ClickWheel
      playClick={playClick}
      onSeek={handleSeek}
    />
  )

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >

      {/* Floating Tools UI */}
      <div className={`fixed top-6 right-6 z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700 ${exportStatus !== "idle" ? 'opacity-0 pointer-events-none' : ''}`}>
          {/* Settings / Theme */}
          <div className="relative group">
            <IconButton
              icon={<Settings className="w-5 h-5" />}
              label="Theme"
              onClick={() => setShowSettings(!showSettings)}
              isActive={showSettings}
            />

            {showSettings && (
              <div className="absolute top-0 right-14 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl w-[260px] animate-in slide-in-from-right-2 border border-white/20">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">Case Color</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['#F5F5F7', '#1c1c1e', '#e63946', '#457b9d', '#2a9d8f'].map(c => (
                    <button
                      key={c}
                      onClick={() => setSkinColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${skinColor === c ? 'border-blue-500 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {/* System Color Picker integrated */}
                  <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-500 cursor-pointer overflow-hidden transition-colors">
                    <Plus className="w-4 h-4 text-gray-400" />
                    <input
                      type="color"
                      value={skinColor}
                      onChange={(e) => setSkinColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">Background</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setBgColor("#E5E5E5")} className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300" title="Light" />
                  <button onClick={() => setBgColor("#111111")} className="w-6 h-6 rounded-full bg-neutral-900 border border-gray-600" title="Dark" />
                  <button onClick={() => setBgColor("#e0fbfc")} className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100" title="Mint" />
                  {/* Background color picker */}
                  <div className="relative w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:scale-110 cursor-pointer overflow-hidden bg-white">
                    <Plus className="w-3 h-3 text-black" />
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Modes */}
          <div className="flex flex-col gap-2 p-2 bg-black/5 backdrop-blur-sm rounded-full">
            <IconButton
              icon={<Smartphone className="w-5 h-5" />}
              label="Flat View"
              isActive={viewMode === 'flat'}
              onClick={() => setViewMode('flat')}
            />
            <IconButton
              icon={<Box className="w-5 h-5" />}
              label="3D Experience"
              isActive={viewMode === '3d'}
              onClick={() => setViewMode('3d')}
            />
            <IconButton
              icon={<Monitor className="w-5 h-5" />}
              label="Focus Mode"
              isActive={viewMode === 'focus'}
              onClick={() => setViewMode('focus')}
            />
          </div>

          {/* Export Action */}
          <IconButton
            icon={
              exportStatus === "success" ? (
                <Check className="w-5 h-5" />
              ) : exportStatus === "preparing" || exportStatus === "sharing" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Share className="w-5 h-5" />
              )
            }
            label={
              exportStatus === "preparing"
                ? "Preparing..."
                : exportStatus === "sharing"
                  ? "Sharing..."
                  : exportStatus === "success"
                    ? "Done!"
                    : "Export Image"
            }
            onClick={handleExport}
            contrast={true}
            className={`transition-colors duration-300 ${
              exportStatus === "success"
                ? "bg-green-500 hover:bg-green-600 border-none"
                : exportStatus === "preparing" || exportStatus === "sharing"
                  ? "bg-blue-500 hover:bg-blue-600 border-none"
                  : ""
            }`}
          />
        </div>


      {/* 3D MODE (R3F) */}
      {viewMode === '3d' && (
        <ThreeDIpod
          skinColor={skinColor}
          screen={screenComponent}
          wheel={wheelComponent}
        />
      )}

      {/* 2D / EXPORT MODE */}
      <div
        className={`relative transition-all duration-700 ${viewMode !== '3d' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none absolute'}`}
        style={{
          transform: viewMode === 'focus' ? 'scale(1.5)' : undefined
        }}
      >
        <div ref={exportTargetRef} className="p-12 rounded-[50px] transition-colors duration-300" style={{ backgroundColor: exportStatus !== "idle" ? bgColor : 'transparent' }}>
          <div
            className="relative w-[370px] h-[620px] rounded-[36px] transition-all duration-300 flex flex-col items-center justify-between p-6"
            style={{
              backgroundColor: skinColor,
              // FAKE PHYSICS DEPTH for 2D/Export
              boxShadow: exportStatus !== "idle"
                // Export shadow: Simulates depth in the flat image
                ? `20px 20px 60px rgba(0,0,0,0.15), -10px -10px 40px rgba(255,255,255,0.4), inset 0 0 0 2px rgba(0,0,0,0.05)`
                // Live shadow
                : `0 30px 60px -15px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.05)`,
            }}
          >
            {/* Subtle Bevel for "fake 3D" in export */}
            {exportStatus !== "idle" && (
              <div className="absolute inset-0 rounded-[36px] border-[4px] border-black/5 pointer-events-none" />
            )}

            {/* SCREEN AREA */}
            <div className="w-full">
              {screenComponent}
            </div>

            {/* CONTROL AREA */}
            <div className="flex-1 flex items-center justify-center relative -mt-4">
              {wheelComponent}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
