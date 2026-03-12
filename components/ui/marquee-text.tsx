"use client";

import React, { useEffect, useRef, useState } from "react";

interface MarqueeTextProps {
  text: string;
  className?: string;
  textClassName?: string;
  speed?: number;
  delay?: number;
  autoPlay?: boolean;
}

export function MarqueeText({
  text,
  className = "",
  textClassName = "",
  speed = 48,
  delay = 1500,
  autoPlay = true,
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;

    const checkOverflow = () => {
      const nextDistance = Math.max(content.scrollWidth - container.clientWidth, 0);
      setShouldScroll(nextDistance > 2);
      setDistance(nextDistance);
      if (nextDistance > 0) {
        setDuration(Math.max(nextDistance / speed, 2.4));
      } else {
        setDuration(0);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [text, speed, autoPlay]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div
        ref={contentRef}
        className={`inline-block whitespace-nowrap ${textClassName} ${
          shouldScroll && autoPlay ? "ipod-marquee" : ""
        }`}
        style={{
          ["--marquee-distance" as string]: `${distance}px`,
          ["--marquee-duration" as string]: `${duration}s`,
          ["--marquee-delay" as string]: `${delay}ms`,
        }}
      >
        {text}
      </div>
    </div>
  );
}
