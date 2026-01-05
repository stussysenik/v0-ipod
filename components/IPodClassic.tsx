"use client"

import { useState, useRef } from "react"
import { Battery, Play } from 'lucide-react'
import { StarRating } from "./star-rating"
import { ProgressBar } from "./progress-bar"
import { EditableText } from "./editable-text"

interface Song {
  title: string
  artist: string
  album: string
  artwork: string
  duration: number
  currentTime: number
  rating: number
}

export function IPodClassic() {
  const [song, setSong] = useState<Song>({
    title: "Gamma Ray",
    artist: "Beck",
    album: "Modern Guilt",
    artwork: "/placeholder.svg?height=300&width=300",
    duration: 95, // 1:35 in seconds
    currentTime: 82, // 1:22 in seconds
    rating: 4
  })

  const containerRef = useRef<HTMLDivElement>(null)

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleExport = () => {
    if (containerRef.current) {
      // Implementation for exporting as image would go here
      console.log("Exporting iPod display as image...")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div 
        ref={containerRef}
        className="w-[min(350px,80vw)] aspect-[9/16] bg-white rounded-3xl shadow-lg overflow-hidden"
      >
        <div className="h-full flex flex-col">
          {/* iPod Screen */}
          <div className="flex-grow bg-gray-100 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">Now Playing</span>
              <div className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                <Battery className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex-grow flex flex-col">
              <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
                <img
                  src={song.artwork || "/placeholder.svg"}
                  alt="Album artwork"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-2 mb-4">
                <h2 className="text-lg font-bold truncate">
                  <EditableText
                    value={song.title}
                    onChange={(value) => setSong({ ...song, title: value })}
                    maxLength={32}
                  />
                </h2>
                <p className="text-sm text-gray-600 truncate">
                  <EditableText
                    value={song.artist}
                    onChange={(value) => setSong({ ...song, artist: value })}
                    maxLength={32}
                  />
                </p>
                <p className="text-sm text-gray-600 truncate">
                  <EditableText
                    value={song.album}
                    onChange={(value) => setSong({ ...song, album: value })}
                    maxLength={32}
                  />
                </p>
              </div>
              
              <StarRating
                rating={song.rating}
                onChange={(rating) => setSong({ ...song, rating })}
              />
              
              <div className="mt-4">
                <ProgressBar
                  currentTime={song.currentTime}
                  duration={song.duration}
                  onSeek={(time) => setSong({ ...song, currentTime: time })}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{formatTime(song.currentTime)}</span>
                  <span>-{formatTime(song.duration - song.currentTime)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* iPod Controls */}
          <div className="h-32 bg-gray-200 flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full shadow flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleExport}
        className="mt-8 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
      >
        Export for Instagram
      </button>
    </div>
  )
}

