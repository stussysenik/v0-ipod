"use client"

import { useReducer, useRef, useCallback, useState, useEffect } from "react"
import { Battery, Settings, Box, Share, Monitor, Smartphone, Check, Plus } from "lucide-react"
import { toPng } from "html-to-image"
import { StarRating } from "./star-rating"
import { ProgressBar } from "./progress-bar"
import { ImageUpload } from "./image-upload"
import { EditableText } from "./editable-text"
import { EditableTime } from "./editable-time"
import { EditableDuration } from "./editable-duration"
import { IconButton } from "./icon-button"
import type { SongMetadata } from "../types/ipod"

// Base64 click sound (short tick)
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
    default:
      return state
  }
}

export default function IPodClassic() {
  const [state, dispatch] = useReducer(songReducer, initialState)
  const [isExporting, setIsExporting] = useState(false)

  // View State: 'flat' (Standard 2D), '3d' (Angled), 'focus' (Close-up interface)
  const [viewMode, setViewMode] = useState<"flat" | "3d" | "focus">("flat")

  // Customization State
  const [skinColor, setSkinColor] = useState("#F5F5F7") // Default to Classic White
  const [bgColor, setBgColor] = useState("#E5E5E5")
  const [showSettings, setShowSettings] = useState(false)

  // 3D Mouse Tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const ipodRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Mouse Tracking for 3D Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (viewMode !== '3d') return
      const { innerWidth, innerHeight } = window
      const x = (e.clientX - innerWidth / 2) / innerWidth
      const y = (e.clientY - innerHeight / 2) / innerHeight
      setMousePos({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [viewMode])

  // Scroll Wheel Logic
  useEffect(() => {
    audioRef.current = new Audio(CLICK_SOUND)

    const wheel = wheelRef.current
    if (!wheel) return

    let isInternalDrag = false
    let startAngle = 0
    let lastAngle = 0

    const calculateAngle = (e: MouseEvent | TouchEvent) => {
      const rect = wheel.getBoundingClientRect()
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
      return Math.atan2(clientY - center.y, clientX - center.x) * (180 / Math.PI)
    }

    const handleStart = (e: MouseEvent | TouchEvent) => {
      isInternalDrag = true
      startAngle = calculateAngle(e)
      lastAngle = startAngle
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isInternalDrag) return
      e.preventDefault()

      const currentAngle = calculateAngle(e)
      let delta = currentAngle - lastAngle

      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360

      if (Math.abs(delta) > 15) {
        const direction = delta > 0 ? 1 : -1
        const seekAmount = 5

        dispatch({
          type: "UPDATE_CURRENT_TIME",
          payload: state.currentTime + (direction * seekAmount)
        })

        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(() => { })
        }

        lastAngle = currentAngle
      }
    }

    const handleEnd = () => {
      isInternalDrag = false
    }

    wheel.addEventListener('mousedown', handleStart)
    wheel.addEventListener('touchstart', handleStart, { passive: false })
    window.addEventListener('mousemove', handleMove, { passive: false })
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchend', handleEnd)

    return () => {
      wheel.removeEventListener('mousedown', handleStart)
      wheel.removeEventListener('touchstart', handleStart)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [state.currentTime])

  const playClick = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => { })
    }
  }, [])

  const handleExport = useCallback(async () => {
    if (!captureRef.current) return
    setIsExporting(true)
    playClick()

    // Wait for UI to settle
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 4, // Ultra high quality
        style: {
          transform: 'none', // Ensure it exports flat regardless of current view
          boxShadow: 'none',
        }
      })

      const link = document.createElement("a")
      link.download = `ipod-${state.title.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }, [playClick, state.title])

  // Calculate 3D Rotation based on mouse position
  const rotateX = viewMode === '3d' ? mousePos.y * -15 : 0
  const rotateY = viewMode === '3d' ? mousePos.x * 15 : 0

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >

      {/* Floating Tools UI */}
      {!isExporting && (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
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
            icon={isExporting ? <Check className="w-5 h-5" /> : <Share className="w-5 h-5" />}
            label="Export Image"
            onClick={handleExport}
            className={`text-white transition-colors duration-300 ${isExporting ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          />
        </div>
      )}

      {/* Capture Container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          perspective: viewMode === '3d' ? '1200px' : 'none',
          transform: viewMode === 'focus' ? 'scale(1.5)' : 'scale(1)',
          transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div
          ref={captureRef}
          className={`relative transition-transform duration-100 ease-out will-change-transform ${isExporting ? 'p-12' : ''}`}
          style={{
            transformStyle: 'preserve-3d',
            transform: viewMode === '3d'
              ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
              : 'rotateX(0) rotateY(0)',
          }}
        >

          {/* THE IPOD CHASSIS */}
          <div
            ref={ipodRef}
            data-export-target="true"
            className="relative w-[370px] h-[620px] rounded-[36px] transition-shadow duration-300"
            style={{
              backgroundColor: skinColor,
              // Dynamic Shadow for 3D realism
              boxShadow: viewMode === '3d'
                ? `${-mousePos.x * 30}px ${-mousePos.y * 30 + 30}px 80px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,0,0,0.1)`
                : `0 30px 60px -15px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.1)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Depth Extrusion (Visual fake side thickness) */}
            {viewMode === '3d' && (
              <>
                <div className="absolute inset-0 rounded-[36px] bg-[#999] translate-z-[-10px]" style={{ transform: 'translateZ(-15px)' }} />
                {/* Side sheen layers would go here if using true 3D geometry, but CSS box-shadow handles most of it nicely for "Analogue" feel */}
              </>
            )}

            {/* Dynamic Light Sheen (Analogue 3D effect) */}
            <div
              className="absolute inset-0 rounded-[36px] pointer-events-none z-50 mix-blend-soft-light transition-opacity duration-500"
              style={{
                opacity: viewMode === '3d' ? 0.6 : 0.1,
                background: `linear-gradient(${135 + (mousePos.x * 40)}deg, rgba(255,255,255,0.8) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.2) 100%)`
              }}
            />

            {/* Chassis Content */}
            <div className="relative w-full h-full p-6 flex flex-col justify-between" style={{ transform: 'translateZ(1px)' }}>

              {/* SCREEN AREA */}
              <div
                className="w-[322px] h-[240px] bg-black rounded-lg p-[2px] mx-auto shadow-inner z-10 shrink-0 relative group"
                style={{ transform: 'translateZ(2px)' }} // Slight pop
              >
                {/* Screen Glass Reflection */}
                <div className="absolute inset-0 z-50 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-50" />

                <div className="w-full h-full bg-white rounded-[4px] overflow-hidden relative border-2 border-[#555]">
                  {/* STATUS BAR */}
                  <div className="h-[20px] bg-gradient-to-b from-[#EEE] to-[#CCC] border-b border-[#999] flex items-center justify-between px-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-black/80">
                      <span className="text-blue-600">▶</span> Now Playing
                    </div>
                    <Battery className="w-4 h-3 text-black opacity-60" />
                  </div>

                  {/* CONTENT GRID */}
                  <div className="flex h-[180px]">
                    {/* LEFT: ARTWORK */}
                    <div className="w-[140px] h-full p-3 flex flex-col justify-start items-center">
                      <div className="w-[114px] h-[114px] bg-[#EEE] shadow-md border border-[#999] relative group cursor-pointer transition-transform active:scale-95">
                        <ImageUpload
                          currentImage={state.artwork}
                          onImageChange={(artwork) => {
                            dispatch({ type: "UPDATE_ARTWORK", payload: artwork })
                            playClick()
                          }}
                          className="w-full h-full object-cover"
                        />
                        {/* Reflection */}
                        <div className="absolute -bottom-[20%] left-0 right-0 h-[20%] bg-gradient-to-b from-white/30 to-transparent transform scale-y-[-1] opacity-30 pointer-events-none" />
                      </div>
                    </div>

                    {/* RIGHT: INFO (Editable) */}
                    <div className="flex-1 pt-6 pr-2 overflow-hidden flex flex-col items-start text-left z-20">
                      {/* Title */}
                      <div className="w-full mb-1 relative z-20">
                        <div className="text-[14px] font-bold text-black leading-tight">
                          <EditableText
                            value={state.title}
                            onChange={(val) => dispatch({ type: "UPDATE_TITLE", payload: val })}
                            className="font-bold min-w-[50px] -ml-1 pl-1"
                          />
                        </div>
                      </div>

                      {/* Artist */}
                      <div className="w-full mb-1 relative z-20">
                        <div className="text-[12px] font-semibold text-[#555] leading-tight">
                          <EditableText
                            value={state.artist}
                            onChange={(val) => dispatch({ type: "UPDATE_ARTIST", payload: val })}
                            className="font-semibold text-[#555] -ml-1 pl-1"
                          />
                        </div>
                      </div>

                      {/* Album */}
                      <div className="w-full mb-3 relative z-20">
                        <div className="text-[12px] font-medium text-[#777] leading-tight">
                          <EditableText
                            value={state.album}
                            onChange={(val) => dispatch({ type: "UPDATE_ALBUM", payload: val })}
                            className="font-medium text-[#777] -ml-1 pl-1"
                          />
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="text-[10px] text-[#888] mb-1">
                        {state.trackNumber} of {state.totalTracks}
                      </div>

                      <div className="scale-75 origin-left -ml-1 relative z-20">
                        <StarRating
                          rating={state.rating}
                          onChange={(rating) => {
                            dispatch({ type: "UPDATE_RATING", payload: rating })
                            playClick()
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM: PROGRESS */}
                  <div className="absolute bottom-0 left-0 right-0 h-[40px] bg-white border-t border-[#CCC] px-3 py-2">
                    <ProgressBar
                      currentTime={state.currentTime}
                      duration={state.duration}
                      onSeek={(currentTime) => {
                        dispatch({ type: "UPDATE_CURRENT_TIME", payload: currentTime })
                        playClick()
                      }}
                    />
                    <div className="flex justify-between items-center mt-0.5 text-[11px] font-semibold text-black font-mono">
                      <EditableTime
                        value={state.currentTime}
                        onChange={(time) => dispatch({ type: "UPDATE_CURRENT_TIME", payload: time })}
                      />
                      {/* Display Remaining Time / Total Duration (Editable) */}
                      <div className="text-black flex items-center gap-1">
                        <span className="opacity-50 text-[10px] mr-1">total:</span>
                        <EditableDuration
                          value={state.duration}
                          onChange={(newDuration) => dispatch({ type: "UPDATE_DURATION", payload: newDuration })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTROL AREA */}
              <div className="flex-1 flex items-center justify-center relative -mt-4">
                {/* WHEEL CONTAINER */}
                <div ref={wheelRef}
                  className="relative w-[240px] h-[240px] cursor-grab active:cursor-grabbing touch-none rounded-full"
                  style={{ transform: 'translateZ(4px)' }} // Stick out slightly
                >
                  {/* Wheel Surface - Clean Matte Look */}
                  <div className="absolute inset-0 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.15),_inset_0_1px_2px_rgba(255,255,255,0.8)] bg-[#FDFDFD]"
                    style={{
                      background: "radial-gradient(circle at 30% 30%, #FFFFFF 0%, #F0F0F0 100%)"
                    }}
                  >
                    {/* Button Labels */}
                    <div className="absolute top-[12%] left-1/2 -translate-x-1/2 text-[12px] font-bold text-[#CCC] tracking-widest uppercase pointer-events-none font-sans">Menu</div>
                    <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-[18px] text-[#DDD] pointer-events-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" transform="translate(4,0) scale(0.6)" /></svg>
                    </div>
                    <div className="absolute left-[12%] top-1/2 -translate-y-1/2 text-[18px] text-[#DDD] pointer-events-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" /></svg>
                    </div>
                    <div className="absolute right-[12%] top-1/2 -translate-y-1/2 text-[18px] text-[#DDD] pointer-events-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" /></svg>
                    </div>
                  </div>

                  {/* Center Button */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84px] h-[84px] rounded-full bg-linear-to-b from-white to-[#F0F0F0] shadow-[0_2px_5px_rgba(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,1)] active:scale-95 transition-transform z-20 cursor-pointer border border-[#EBEBEB]"
                    onClick={(e) => {
                      e.stopPropagation()
                      playClick()
                    }}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
