"use client";

import React, { useEffect, useRef, useState } from "react";

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export function MarqueeText({
  text,
  className = "",
  speed = 50,
  delay = 2000,
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;

    const checkOverflow = () => {
      setShouldScroll(content.scrollWidth > container.clientWidth);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [text]);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current || !shouldScroll || !isHovered)
      return;

    const container = containerRef.current;
    const content = contentRef.current;
    let animationFrame: number;
    let startTime: number | null = null;
    let currentPosition = 0;
    const totalDistance = content.scrollWidth - container.clientWidth;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < delay) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      currentPosition =
        ((progress - delay) / speed) % (totalDistance + container.clientWidth);

      if (currentPosition <= totalDistance) {
        content.style.transform = `translateX(${-currentPosition}px)`;
        setScrolling(true);
      } else {
        content.style.transform = "translateX(0)";
        startTime = timestamp;
        setScrolling(false);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      content.style.transform = "translateX(0)";
      setScrolling(false);
    };
  }, [shouldScroll, isHovered, speed, delay]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (contentRef.current) {
          contentRef.current.style.transform = "translateX(0)";
        }
      }}
    >
      <div
        ref={contentRef}
        className={`inline-block whitespace-nowrap transition-transform ${
          !scrolling ? "duration-300" : "duration-0"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
