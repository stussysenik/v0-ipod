"use client"

import { useReducer, useRef, useCallback, useState, useEffect } from "react"
import { Battery, Settings, Box, Maximize, Minimize, Share, Monitor, Smartphone } from "lucide-react"
import html2canvas from "html2canvas"
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
  currentTime: 122,
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


  const ipodRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
      // Only prevent default if we're not touching a button
      // But for wheel logic, we usually want to capture valid drags
      isInternalDrag = true
      startAngle = calculateAngle(e)
      lastAngle = startAngle
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isInternalDrag) return
      e.preventDefault() // Stop page scroll

      const currentAngle = calculateAngle(e)
      let delta = currentAngle - lastAngle

      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360

      // Sensitivity
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

    // Wait for state updates and DOM to settle (hiding noise, etc.)
    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      const scale = 4 // High quality export
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: null,
        scale: scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('[data-export-target="true"]') as HTMLElement
          if (element) {
            // Ensure shadows are crisp in export
            element.style.boxShadow = "inset 0 0 20px rgba(0,0,0,0.1), inset 2px 0 5px rgba(255,255,255,0.5), inset -2px 0 5px rgba(0,0,0,0.2), 0 20px 50px rgba(0,0,0,0.3)"
          }
        }
      })

      const url = canvas.toDataURL("image/png", 1.0)
      const link = document.createElement("a")
      link.download = `ipod-${state.title.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = url
      link.click()
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }, [playClick, state.title])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500"
      style={{ backgroundColor: bgColor }}
    >

      {/* Floating Tools UI */}
      {!isExporting && (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          {/* Settings / Theme */}
          <div className="relative">
            <IconButton
              icon={<Settings className="w-5 h-5" />}
              label="Theme"
              onClick={() => setShowSettings(!showSettings)}
              isActive={showSettings}
            />

            {showSettings && (
              <div className="absolute top-0 right-14 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl w-[220px] animate-in slide-in-from-right-2 border border-white/20">
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
                  <input
                    type="color"
                    value={skinColor}
                    onChange={(e) => setSkinColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer overflow-hidden opacity-0 absolute"
                    id="custom-color"
                  />
                  <label htmlFor="custom-color" className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50 text-gray-400">+</label>
                </div>

                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">Background</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setBgColor("#E5E5E5")} className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300" title="Light" />
                  <button onClick={() => setBgColor("#111111")} className="w-6 h-6 rounded-full bg-neutral-900 border border-gray-600" title="Dark" />
                  <button onClick={() => setBgColor("#e0fbfc")} className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100" title="Mint" />
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
            icon={<Share className="w-5 h-5" />}
            label="Export Image"
            onClick={handleExport}
            className="bg-blue-600 text-white hover:bg-blue-700"
          />
        </div>
      )}

      {/* Capture Container */}
      <div
        className={`relative flex items-center justify-center transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${viewMode === '3d' ? 'perspective-[1500px]' : ''
          }`}
        style={{
          perspective: '1500px',
          transform: viewMode === 'focus' ? 'scale(1.3) translateY(-10%)' : 'scale(1)',
        }}
      >
        <div ref={captureRef}
          className={`transition-all duration-1000 transform-style-3d ${isExporting ? 'p-10' : ''}`}
          style={{
            transform: viewMode === '3d' ? 'rotateY(-15deg) rotateX(10deg)' : 'rotateY(0) rotateX(0)',
          }}
        >

          {/* THE IPOD */}
          <div
            ref={ipodRef}
            data-export-target="true"
            className="relative w-[370px] h-[620px] rounded-[36px] overflow-hidden shrink-0 transition-shadow duration-300"
            style={{
              backgroundColor: skinColor,
              boxShadow: viewMode === '3d'
                ? `20px 20px 60px rgba(0,0,0,0.3), inset 0 0 20px rgba(0,0,0,0.1)`
                : `inset 0 0 20px rgba(0,0,0,0.1), inset 2px 0 5px rgba(255,255,255,0.5), inset -2px 0 5px rgba(0,0,0,0.2), 0 25px 50px -12px rgba(0,0,0,0.25)`,
            }}
          >
            {/* Shadow Wrapper for Export Depth (Only visible in flat/export) */}
            {(viewMode === 'flat' || isExporting) && (
              <div className="absolute -inset-[50px] z-[-1]"
                style={{
                  background: 'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
                  opacity: 0.6,
                  filter: 'blur(30px)',
                  transform: 'translateY(30px) scale(0.95)'
                }}
              />
            )}

            {/* Side Panels for 3D depth illusion */}
            <div className={`absolute top-0 right-0 bottom-0 w-[15px] bg-black/10 origin-right transition-opacity duration-500 ${viewMode === '3d' ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute top-0 bottom-0 left-0 w-[4px] bg-white/20 origin-left transition-opacity duration-500 ${viewMode === '3d' ? 'opacity-100' : 'opacity-0'}`} />

            {/* Chassis Gloss/Noise Texture (Hidden on export) */}
            <div className={`absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-300 ${isExporting ? 'opacity-0' : 'opacity-15'}`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            <div className="relative w-full h-full p-6 flex flex-col justify-between">

              {/* SCREEN AREA */}
              <div className="w-[322px] h-[240px] bg-black rounded-lg p-[2px] mx-auto shadow-[0_2px_4px_rgba(0,0,0,0.4)] z-10 shrink-0">
                <div className="w-full h-full bg-white rounded-[4px] overflow-hidden relative border-2 border-[#555]">
                  {/* STATUS BAR */}
                  <div className="h-[20px] bg-gradient-to-b from-[#EEE] to-[#CCC] border-b border-[#999] flex items-center justify-between px-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-black/80">
                      <span className="text-blue-600">▶</span> Now Playing
                    </div>
                    <Battery className="w-4 h-3 text-black opacity-60" />
                  </div>

                  {/* CONTENT GRID: 153px Height available (approx) */}
                  <div className="flex h-[180px]">
                    {/* LEFT: ARTWORK (Square-ish) */}
                    <div className="w-[140px] h-full p-3 flex flex-col justify-start items-center">
                      <div className="w-[114px] h-[114px] bg-[#EEE] shadow-md border border-[#999] relative group">
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

                    {/* RIGHT: INFO (Text) with Editability */}
                    <div className="flex-1 pt-6 pr-2 overflow-hidden flex flex-col items-start text-left z-20">
                      {/* Title */}
                      <div className="w-full mb-1 relative z-20">
                        <div className="text-[14px] font-bold text-black leading-tight">
                          <EditableText
                            value={state.title}
                            onChange={(val) => dispatch({ type: "UPDATE_TITLE", payload: val })}
                            className="font-bold min-w-[50px]"
                          />
                        </div>
                      </div>

                      {/* Artist */}
                      <div className="w-full mb-1 relative z-20">
                        <div className="text-[12px] font-semibold text-[#555] leading-tight">
                          <EditableText
                            value={state.artist}
                            onChange={(val) => dispatch({ type: "UPDATE_ARTIST", payload: val })}
                            className="font-semibold text-[#555]"
                          />
                        </div>
                      </div>

                      {/* Album */}
                      <div className="w-full mb-3 relative z-20">
                        <div className="text-[12px] font-medium text-[#777] leading-tight">
                          <EditableText
                            value={state.album}
                            onChange={(val) => dispatch({ type: "UPDATE_ALBUM", payload: val })}
                            className="font-medium text-[#777]"
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
                      {/* Display Remaining Time Properly */}
                      <div className="text-black">
                        -{Math.floor((state.duration - state.currentTime) / 60)}:
                        {Math.floor((state.duration - state.currentTime) % 60).toString().padStart(2, "0")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTROL AREA */}
              <div className="flex-1 flex items-center justify-center relative -mt-4">
                {/* WHEEL CONTAINER */}
                <div ref={wheelRef} className="relative w-[240px] h-[240px] cursor-grab active:cursor-grabbing touch-none">
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
