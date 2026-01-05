"use client"

import { useReducer, useRef } from "react"
import { Battery, Wifi } from "lucide-react"
import { StarRating } from "./star-rating"
import { ProgressBar } from "./progress-bar"
import { ImageUpload } from "./image-upload"
import { EditableText } from "./editable-text"
import type { SongMetadata } from "../types/ipod"

const initialState: SongMetadata = {
  title: "1979 (Remastered 2012)",
  artist: "The Smashing Pumpkins",
  album: "Mellon Collie and the Infinite Sadness",
  artwork: "/placeholder.svg?height=300&width=300",
  duration: 95,
  currentTime: 56,
  rating: 2,
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
      return { ...state, duration: action.payload }
    case "UPDATE_RATING":
      return { ...state, rating: action.payload }
    default:
      return state
  }
}

export default function IPodClassic() {
  const [state, dispatch] = useReducer(songReducer, initialState)
  const ipodRef = useRef<HTMLDivElement>(null)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div
        ref={ipodRef}
        className="relative w-[340px] h-[580px] rounded-[38px] overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #E0E0E0 0%, #BDBDBD 100%)",
          boxShadow: `
            0 20px 60px -12px rgba(0,0,0,0.4),
            0 8px 24px -4px rgba(0,0,0,0.2),
            inset 0 0 0 1px rgba(255,255,255,0.1),
            inset 0 0 60px rgba(0,0,0,0.1)
          `,
        }}
      >
        <div className="relative w-full h-full overflow-hidden">
          {/* Screen */}
          <div
            className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[280px] h-[220px] rounded-sm overflow-hidden"
            style={{
              background: "#FFFFFF",
              boxShadow: `
                0 2px 8px -2px rgba(0,0,0,0.3),
                inset 0 0 0 2px #000000
              `,
            }}
          >
            {/* LCD Matrix Effect */}
            <div
              className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, #000 1px, transparent 1px),
                  linear-gradient(180deg, #000 1px, transparent 1px)
                `,
                backgroundSize: "2px 2px",
              }}
            />

            {/* Header */}
            <div className="h-7 flex justify-between items-center px-2 bg-black">
              <span className="text-xs font-mono tracking-wide text-white">Now Playing</span>
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-white" />
                <Battery className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="p-3 font-mono">
              <div className="flex gap-3">
                {/* Album Art */}
                <div className="w-[80px] h-[80px] flex-shrink-0 bg-black rounded-sm overflow-hidden">
                  <ImageUpload
                    currentImage={state.artwork}
                    onImageChange={(artwork) => dispatch({ type: "UPDATE_ARTWORK", payload: artwork })}
                    className="w-full h-full"
                  />
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <h2 className="text-sm font-bold leading-tight text-black">
                    <EditableText
                      value={state.title}
                      onChange={(value) => dispatch({ type: "UPDATE_TITLE", payload: value })}
                      className="block w-full"
                    />
                  </h2>
                  <p className="text-sm text-gray-600">
                    <EditableText
                      value={state.artist}
                      onChange={(value) => dispatch({ type: "UPDATE_ARTIST", payload: value })}
                      className="block w-full"
                    />
                  </p>
                  <p className="text-sm text-gray-600">
                    <EditableText
                      value={state.album}
                      onChange={(value) => dispatch({ type: "UPDATE_ALBUM", payload: value })}
                      className="block w-full"
                    />
                  </p>
                  <div className="pt-1">
                    <StarRating
                      rating={state.rating}
                      onChange={(rating) => dispatch({ type: "UPDATE_RATING", payload: rating })}
                    />
                  </div>
                  <div className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                    {state.trackNumber} of {state.totalTracks}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pb-2">
                <ProgressBar
                  currentTime={state.currentTime}
                  duration={state.duration}
                  onSeek={(currentTime) => dispatch({ type: "UPDATE_CURRENT_TIME", payload: currentTime })}
                />
              </div>
            </div>
          </div>

          {/* Click Wheel */}
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[220px] h-[220px]">
            <div className="relative w-full h-full">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(180deg, #2C2C2C 0%, #1A1A1A 100%)",
                  boxShadow: `
                    0 4px 12px rgba(0,0,0,0.3),
                    inset 0 1px 1px rgba(255,255,255,0.2)
                  `,
                }}
              >
                {/* Center Button */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] rounded-full"
                  style={{
                    background: "linear-gradient(180deg, #FFFFFF 0%, #E0E0E0 100%)",
                    boxShadow: `
                      0 2px 6px rgba(0,0,0,0.2),
                      inset 0 1px 2px rgba(255,255,255,0.5)
                    `,
                  }}
                />

                {/* Control Buttons */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 text-white text-sm font-mono tracking-wide">
                  MENU
                </div>

                <div className="absolute top-1/2 left-7 -translate-y-1/2 text-white text-2xl">⏮</div>

                <div className="absolute top-1/2 right-7 -translate-y-1/2 text-white text-2xl">⏭</div>

                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-white text-2xl">⏯</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

