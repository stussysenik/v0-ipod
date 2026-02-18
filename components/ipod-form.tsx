"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "./star-rating";
import type { SongMetadata } from "../types/ipod";

interface iPodFormProps {
  song: SongMetadata;
  onChange: (song: SongMetadata) => void;
}

export function iPodForm({ song, onChange }: iPodFormProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange({ ...song, artwork: e.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Label className="block mb-2">Album Artwork</Label>
        <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg overflow-hidden">
          {song.artwork ? (
            <img
              src={song.artwork || "/placeholder.svg"}
              alt="Album artwork"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Drag image here
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Song Title</Label>
        <Input
          id="title"
          value={song.title}
          maxLength={32}
          onChange={(e) => onChange({ ...song, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="artist">Artist</Label>
        <Input
          id="artist"
          value={song.artist}
          maxLength={32}
          onChange={(e) => onChange({ ...song, artist: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="album">Album</Label>
        <Input
          id="album"
          value={song.album}
          maxLength={32}
          onChange={(e) => onChange({ ...song, album: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trackNumber">Track Number</Label>
          <Input
            id="trackNumber"
            type="number"
            min={1}
            value={song.trackNumber}
            onChange={(e) => onChange({ ...song, trackNumber: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalTracks">Total Tracks</Label>
          <Input
            id="totalTracks"
            type="number"
            min={1}
            value={song.totalTracks}
            onChange={(e) => onChange({ ...song, totalTracks: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentTime">Current Time</Label>
        <Input
          id="currentTime"
          value={song.currentTime}
          onChange={(e) => onChange({ ...song, currentTime: e.target.value })}
          placeholder="1:22"
        />
      </div>

      <div className="space-y-2">
        <Label>Rating</Label>
        <StarRating
          rating={song.rating}
          onChange={(rating) => onChange({ ...song, rating })}
        />
      </div>
    </div>
  );
}
