"use client";

import { useState, useRef, useEffect } from "react";

interface EditableTrackNumberProps {
  trackNumber: number;
  totalTracks: number;
  onTrackNumberChange: (trackNumber: number) => void;
  onTotalTracksChange: (totalTracks: number) => void;
  className?: string;
  disabled?: boolean;
}

export function EditableTrackNumber({
  trackNumber,
  totalTracks,
  onTrackNumberChange,
  onTotalTracksChange,
  className = "",
  disabled = false,
}: EditableTrackNumberProps) {
  const [isEditingTrack, setIsEditingTrack] = useState(false);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [trackValue, setTrackValue] = useState(trackNumber.toString());
  const [totalValue, setTotalValue] = useState(totalTracks.toString());

  const trackInputRef = useRef<HTMLInputElement>(null);
  const totalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTrackValue(trackNumber.toString());
  }, [trackNumber]);

  useEffect(() => {
    setTotalValue(totalTracks.toString());
  }, [totalTracks]);

  useEffect(() => {
    if (isEditingTrack && trackInputRef.current) {
      trackInputRef.current.focus();
      trackInputRef.current.select();
    }
  }, [isEditingTrack]);

  useEffect(() => {
    if (isEditingTotal && totalInputRef.current) {
      totalInputRef.current.focus();
      totalInputRef.current.select();
    }
  }, [isEditingTotal]);

  useEffect(() => {
    if (!disabled) return;
    setIsEditingTrack(false);
    setIsEditingTotal(false);
    setTrackValue(trackNumber.toString());
    setTotalValue(totalTracks.toString());
  }, [disabled, trackNumber, totalTracks]);

  const handleTrackBlur = () => {
    const num = parseInt(trackValue, 10);
    if (!isNaN(num) && num >= 1 && num <= totalTracks) {
      onTrackNumberChange(num);
    } else {
      setTrackValue(trackNumber.toString());
    }
    setIsEditingTrack(false);
  };

  const handleTotalBlur = () => {
    const num = parseInt(totalValue, 10);
    if (!isNaN(num) && num >= 1 && num >= trackNumber) {
      onTotalTracksChange(num);
    } else {
      setTotalValue(totalTracks.toString());
    }
    setIsEditingTotal(false);
  };

  const handleTrackKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTrackBlur();
    } else if (e.key === "Escape") {
      setTrackValue(trackNumber.toString());
      setIsEditingTrack(false);
    }
  };

  const handleTotalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTotalBlur();
    } else if (e.key === "Escape") {
      setTotalValue(totalTracks.toString());
      setIsEditingTotal(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      data-testid="track-number-container"
    >
      {isEditingTrack ? (
        <input
          ref={trackInputRef}
          type="text"
          value={trackValue}
          onChange={(e) => setTrackValue(e.target.value)}
          onBlur={handleTrackBlur}
          onKeyDown={handleTrackKeyDown}
          className="w-6 bg-white border border-blue-400 rounded px-0.5 text-center outline-none"
          style={{ fontSize: "inherit", fontFamily: "inherit" }}
          data-testid="track-number-input"
        />
      ) : (
        <span
          onClick={() => {
            if (!disabled) {
              setIsEditingTrack(true);
            }
          }}
          className={`${disabled ? "cursor-default" : "cursor-pointer hover:bg-black/5"} rounded px-0.5 transition-colors`}
          data-testid="track-number-value"
        >
          {trackNumber}
        </span>
      )}
      <span>of</span>
      {isEditingTotal ? (
        <input
          ref={totalInputRef}
          type="text"
          value={totalValue}
          onChange={(e) => setTotalValue(e.target.value)}
          onBlur={handleTotalBlur}
          onKeyDown={handleTotalKeyDown}
          className="w-6 bg-white border border-blue-400 rounded px-0.5 text-center outline-none"
          style={{ fontSize: "inherit", fontFamily: "inherit" }}
          data-testid="total-tracks-input"
        />
      ) : (
        <span
          onClick={() => {
            if (!disabled) {
              setIsEditingTotal(true);
            }
          }}
          className={`${disabled ? "cursor-default" : "cursor-pointer hover:bg-black/5"} rounded px-0.5 transition-colors`}
          data-testid="total-tracks-value"
        >
          {totalTracks}
        </span>
      )}
    </div>
  );
}
