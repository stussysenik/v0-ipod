"use client"

import { Battery } from "lucide-react"
import { StarRating } from "./star-rating"
import { ProgressBar } from "./progress-bar"
import { ImageUpload } from "./image-upload"
import { EditableText } from "./editable-text"
import { EditableTime } from "./editable-time"
import { EditableDuration } from "./editable-duration"
import type { SongMetadata } from "../types/ipod"

interface IpodScreenProps {
        state: SongMetadata
        dispatch: any
        playClick: () => void
}

export function IpodScreen({ state, dispatch, playClick }: IpodScreenProps) {
        return (
                <div className="w-[322px] h-[240px] bg-black rounded-lg p-[2px] mx-auto shadow-inner z-10 shrink-0 relative group">
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
                                <div className="absolute bottom-0 left-0 right-0 h-[40px] bg-white px-3 py-2">
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
                                                        <EditableDuration
                                                                value={state.duration}
                                                                onChange={(newDuration) => dispatch({ type: "UPDATE_DURATION", payload: newDuration })}
                                                        />
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        )
}
