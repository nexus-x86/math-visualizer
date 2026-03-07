"use client";

import React, { useRef, useEffect, useState } from "react";

interface PlaybackControlsProps {
    isRunning: boolean;
    onPlay: () => void;
    onStop: () => void;
    currentTime?: number;
    totalTime?: number;
}

export default function PlaybackControls({
    isRunning,
    onPlay,
    onStop,
    currentTime = 0,
    totalTime = 0,
}: PlaybackControlsProps) {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    // Simulated progress based on running state
    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = Date.now();
            intervalRef.current = setInterval(() => {
                const elapsed = (Date.now() - startTimeRef.current) / 1000;
                const total = totalTime > 0 ? totalTime : 30;
                setProgress(Math.min(elapsed / total, 1));
            }, 50);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (!isRunning) setProgress(0);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, totalTime]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const elapsed = totalTime > 0 ? progress * totalTime : progress * 30;
    const total = totalTime > 0 ? totalTime : 30;

    return (
        <div
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "48px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "0 20px",
                background: "rgba(8, 8, 14, 0.9)",
                backdropFilter: "blur(12px)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                zIndex: 15,
            }}
        >
            {/* Play/Stop button */}
            <button
                onClick={isRunning ? onStop : onPlay}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "none",
                    background: isRunning ? "rgba(239, 68, 68, 0.2)" : "rgba(20, 184, 166, 0.15)",
                    color: isRunning ? "#ef4444" : "#14b8a6",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                }}
            >
                {isRunning ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                )}
            </button>

            {/* Timeline bar */}
            <div
                style={{
                    flex: 1,
                    height: "4px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "2px",
                    position: "relative",
                    cursor: "pointer",
                }}
            >
                {/* Fill */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: `${progress * 100}%`,
                        background: "linear-gradient(90deg, #14b8a6, #0ea5e9)",
                        borderRadius: "2px",
                        transition: isRunning ? "none" : "width 0.3s ease",
                    }}
                />
                {/* Knob */}
                <div
                    style={{
                        position: "absolute",
                        top: "-4px",
                        left: `${progress * 100}%`,
                        transform: "translateX(-50%)",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#14b8a6",
                        border: "2px solid #0a0a0f",
                        boxShadow: "0 0 8px rgba(20, 184, 166, 0.4)",
                        opacity: isRunning ? 1 : 0.5,
                        transition: "opacity 0.3s ease",
                    }}
                />
            </div>

            {/* Time display */}
            <span
                style={{
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "monospace",
                    minWidth: "80px",
                    textAlign: "right",
                    flexShrink: 0,
                }}
            >
                <span style={{ color: isRunning ? "#14b8a6" : "rgba(255,255,255,0.4)" }}>
                    {formatTime(elapsed)}
                </span>
                {" / "}
                {formatTime(total)}
            </span>
        </div>
    );
}
