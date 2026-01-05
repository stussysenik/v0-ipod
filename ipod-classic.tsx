"use client"

import { useReducer, useCallback, useState, useRef } from "react"
import { Battery, Wifi } from "lucide-react"
import html2canvas from "html2canvas"
import { debounce } from "lodash"
import { StarRating } from "./star-rating"
import { ProgressBar } from "./progress-bar"
import { ImageUpload } from "./image-upload"
import { EditableTime } from "./editable-time"
import { MarqueeText } from "./marquee-text"
import { EditableDuration } from "./editable-duration"
import type { SongMetadata } from "../types/ipod"

const initialState: SongMetadata = {
  title: "Have A Destination?",
  artist: "Mac Miller",
  album: "Balloonerism",
  artwork:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CleanShot%202025-01-18%20at%2000.05.57@2x-XSRl93BaAamtDX3oHU2TTiiljV5scp.png",
  duration: 94,
  currentTime: 57,
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
      return { ...state, currentTime: action.payload }
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
  const ipodRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const debouncedDispatch = useCallback(
    debounce((action: Action) => dispatch(action), 300),
    [],
  )

  const handleExport = useCallback(async () => {
    if (!ipodRef.current || !contentRef.current) return

    try {
      setIsExporting(true)
      await new Promise((resolve) => setTimeout(resolve, 100))

      const canvas = await html2canvas(ipodRef.current, {
        backgroundColor: null,
        scale: 4,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.download = "ipod-classic.png"
            link.href = url
            link.click()
            URL.revokeObjectURL(url)
          }
        },
        "image/png",
        1.0,
      )
    } catch (error) {
      console.error("Error exporting iPod:", error)
    } finally {
      setIsExporting(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#043321] to-[#032214] flex flex-col items-center justify-center p-4">
      <div
        ref={ipodRef}
        className="relative w-[340px] h-[580px] bg-[#06402B] rounded-[30px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5),0_2px_12px_-4px_rgba(0,0,0,0.3)] overflow-hidden"
        style={{
          boxShadow: `
            0 10px 40px -12px rgba(0,0,0,0.5),
            0 2px 12px -4px rgba(0,0,0,0.3),
            inset 0 0 0 2px rgba(255,255,255,0.1)
          `,
        }}
      >
        <div ref={contentRef} data-export-container className="relative w-full h-full overflow-hidden">
          {/* Screen */}
          <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[280px] h-[220px] bg-[#c7d0c0] rounded-sm overflow-hidden shadow-inner border-4 border-[#043321]">
            {/* Header */}
            <div className="h-6 bg-gradient-to-b from-[#043321] to-[#032214] flex justify-between items-center px-2">
              <span className="text-xs text-[#c7d0c0] font-medium">Now Playing</span>
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-[#c7d0c0]" />
                <Battery className="w-4 h-4 text-[#c7d0c0]" />
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <div className="flex gap-3">
                {/* Album Art */}
                <div className="w-[80px] h-[80px] bg-[#043321] rounded-sm overflow-hidden shadow-md">
                  <ImageUpload
                    currentImage={state.artwork}
                    onImageChange={(artwork) => dispatch({ type: "UPDATE_ARTWORK", payload: artwork })}
                    className="w-full h-full"
                  />
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold leading-tight text-[#043321]">
                    <MarqueeText text={state.title} className="cursor-text" speed={40} delay={1500} />
                  </h2>
                  <p className="text-sm text-[#043321] mt-1">
                    <MarqueeText text={state.artist} className="cursor-text" speed={40} delay={1500} />
                  </p>
                  <p className="text-sm text-[#043321] mt-1">
                    <MarqueeText text={state.album} className="cursor-text" speed={40} delay={1500} />
                  </p>
                  <div className="mt-2">
                    <StarRating
                      rating={state.rating}
                      onChange={(rating) => dispatch({ type: "UPDATE_RATING", payload: rating })}
                    />
                  </div>
                  <p className="text-xs text-[#043321] mt-2">
                    {state.trackNumber} of {state.totalTracks}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <ProgressBar
                  currentTime={state.currentTime}
                  duration={state.duration}
                  onSeek={(currentTime) => dispatch({ type: "UPDATE_CURRENT_TIME", payload: currentTime })}
                />
                <div className="flex justify-between text-xs text-[#043321] mt-1.5">
                  <EditableTime
                    value={state.currentTime}
                    onChange={(time) => dispatch({ type: "UPDATE_CURRENT_TIME", payload: time })}
                    disabled={true}
                  />
                  <EditableDuration
                    value={state.duration}
                    onChange={(duration) => dispatch({ type: "UPDATE_DURATION", payload: duration })}
                    className="text-[#043321]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Click Wheel */}
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[220px] h-[220px]">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-[#075438] to-[#054228] rounded-full shadow-inner">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] bg-[#043321] rounded-full shadow-inner" />

                <div className="absolute top-7 left-1/2 -translate-x-1/2 text-[#c7d0c0] text-sm font-semibold tracking-wide">
                  MENU
                </div>

                <div className="absolute top-1/2 left-7 -translate-y-1/2 text-[#c7d0c0] text-2xl">⏮</div>

                <div className="absolute top-1/2 right-7 -translate-y-1/2 text-[#c7d0c0] text-2xl">⏭</div>

                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[#c7d0c0] text-2xl">⏯</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleExport}
        className="mt-8 px-6 py-2.5 bg-[#043321] text-white text-base font-medium rounded-full hover:bg-[#032214] transition-colors"
        disabled={isExporting}
      >
        {isExporting ? "Exporting..." : "Export iPod"}
      </button>
    </div>
  )
}

