"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";

interface SidebarProps {
    settings: {
        conceptLevel: number;
    };
    onSettingsChange: (key: string, value: any) => void;
    scriptText?: string;
    isRunning?: boolean;
    isPaused?: boolean;
    onPlay?: () => void;
    onStop?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onLoad?: (script: string) => void;
    onSave?: () => void;
}

export default function Sidebar({ settings, onSettingsChange, scriptText, isRunning, isPaused, onPlay, onStop, onPause, onResume, onLoad, onSave }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<"settings" | "script">("settings");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            if (text && onLoad) onLoad(text);
        };
        reader.readAsText(file);
        // Reset so same file can be loaded again
        e.target.value = "";
    };


    const conceptLabels = ["High School", "Early Undergrad", "Late Undergrad"];

    return (
        <div
            style={{
                width: "300px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "rgba(12, 12, 18, 0.95)",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
                overflow: "hidden",
                flexShrink: 0,
            }}
        >
            {/* Logo + Run button row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px 0 24px" }}>
                <Link
                    href="/"
                    style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        textDecoration: "none",
                    }}
                >
                    <img src="/logo.webp" alt="Mathphic" style={{ height: "22px", width: "auto" }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "3px", color: "#e2e8f0", textTransform: "uppercase" }}>MATHPHIC</span>
                </Link>

                {/* State-aware Run/Stop/Pause/Resume buttons */}
                {!isRunning ? (
                    <button
                        onClick={scriptText ? onPlay : undefined}
                        disabled={!scriptText}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: scriptText
                                ? "1px solid rgba(51, 165, 196, 0.5)"
                                : "1px solid rgba(255,255,255,0.08)",
                            background: scriptText
                                ? "linear-gradient(135deg, rgba(51, 165, 196, 0.18), rgba(14, 165, 233, 0.1))"
                                : "rgba(255,255,255,0.04)",
                            color: scriptText ? "#33a5c4" : "rgba(255,255,255,0.2)",
                            cursor: scriptText ? "pointer" : "default",
                            fontFamily: "inherit",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            animation: scriptText ? "readyGlow 2.4s ease-in-out infinite" : "none",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            if (!scriptText) return;
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(51, 165, 196, 0.32), rgba(14, 165, 233, 0.22))";
                            e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                            if (!scriptText) return;
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(51, 165, 196, 0.18), rgba(14, 165, 233, 0.1))";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        {/* Shimmer sweep — only when active */}
                        {scriptText && (
                            <div style={{
                                position: "absolute",
                                top: 0, left: "-100%", width: "60%", height: "100%",
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                                animation: "shimmer 2.4s ease-in-out infinite",
                                pointerEvents: "none",
                            }} />
                        )}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Run
                    </button>
                ) : isPaused ? (
                    /* Paused state: show Resume + Stop */
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            onClick={onResume}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "6px 10px",
                                borderRadius: "8px", border: "1px solid rgba(52, 211, 153, 0.5)",
                                background: "rgba(52, 211, 153, 0.12)", color: "#34d399",
                                cursor: "pointer", fontFamily: "inherit",
                                fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px",
                                textTransform: "uppercase", transition: "all 0.2s ease",
                                animation: "resumeGlow 1.8s ease-in-out infinite",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(52, 211, 153, 0.22)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(52, 211, 153, 0.12)"; }}
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Resume
                        </button>
                        <button
                            onClick={onStop}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: "30px", height: "30px",
                                borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.35)",
                                background: "rgba(239, 68, 68, 0.10)", color: "#ef4444",
                                cursor: "pointer", transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.22)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.10)"; }}
                            title="Stop"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="4" y="4" width="16" height="16" rx="2" />
                            </svg>
                        </button>
                    </div>
                ) : isRunning ? (
                    /* Running state: show Pause + Stop */
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            onClick={onPause}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "6px 10px",
                                borderRadius: "8px", border: "1px solid rgba(251, 191, 36, 0.45)",
                                background: "rgba(251, 191, 36, 0.10)", color: "#fbbf24",
                                cursor: "pointer", fontFamily: "inherit",
                                fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px",
                                textTransform: "uppercase", transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(251, 191, 36, 0.20)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(251, 191, 36, 0.10)"; }}
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                            Pause
                        </button>
                        <button
                            onClick={onStop}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: "30px", height: "30px",
                                borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.35)",
                                background: "rgba(239, 68, 68, 0.10)", color: "#ef4444",
                                cursor: "pointer", transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.22)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.10)"; }}
                            title="Stop"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="4" y="4" width="16" height="16" rx="2" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div style={{ width: "60px" }} />
                )}
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: "flex",
                    padding: "16px 24px 0",
                    gap: "0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {(["settings", "script"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            padding: "10px 0",
                            fontSize: "0.8rem",
                            fontWeight: activeTab === tab ? 600 : 400,
                            color: activeTab === tab ? "#33a5c4" : "rgba(255,255,255,0.4)",
                            background: "none",
                            border: "none",
                            borderBottom: activeTab === tab ? "2px solid #33a5c4" : "2px solid transparent",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textTransform: "capitalize",
                            letterSpacing: "0.5px",
                            fontFamily: "inherit",
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div
                style={{
                    flex: 1,
                    overflowY: activeTab === "script" ? "hidden" : "auto",
                    padding: activeTab === "script" ? "0" : "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    minHeight: 0,
                }}
                className="sidebar-scroll"
            >
                {activeTab === "settings" ? (
                    <>
                        {/* Concept Level */}
                        <div>
                            <div
                                style={{
                                    fontSize: "0.75rem",
                                    color: "rgba(255,255,255,0.5)",
                                    marginBottom: "8px",
                                    letterSpacing: "0.3px",
                                }}
                            >
                                Concept Level
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={2}
                                step={1}
                                value={settings.conceptLevel}
                                onChange={(e) => onSettingsChange("conceptLevel", parseInt(e.target.value))}
                                style={{
                                    width: "100%",
                                    accentColor: "#33a5c4",
                                    cursor: "pointer",
                                }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.6rem",
                                    color: "rgba(255,255,255,0.35)",
                                    marginTop: "4px",
                                }}
                            >
                                {conceptLabels.map((label, i) => (
                                    <span
                                        key={label}
                                        style={{
                                            color: settings.conceptLevel === i ? "#33a5c4" : undefined,
                                            fontWeight: settings.conceptLevel === i ? 600 : 400,
                                        }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                            {/* Hidden file input for .derp loading */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".desp"
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />
                            <ActionButton label="Load" variant="load" onClick={handleLoadClick} />
                            <ActionButton label="Export" variant="primary" onClick={onSave} />
                        </div>
                    </>
                ) : activeTab === "script" ? (
                    scriptText ? (
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                            <div
                                style={{
                                    flex: 1,
                                    overflowY: "auto",
                                    minHeight: 0,
                                    padding: "16px 0",
                                    fontFamily: "'Geist Mono', 'Fira Code', 'Courier New', monospace",
                                    fontSize: "0.7rem",
                                    lineHeight: 1.7,
                                }}
                                className="sidebar-scroll"
                            >
                                {scriptText.split("\n").map((line, i) => {
                                    // Simple keyword highlighting
                                    const isComment = line.trim().startsWith("//");
                                    const keyword = line.trim().split(" ")[0];
                                    const isCmd = !isComment && keyword.length > 0;
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex",
                                                paddingRight: "16px",
                                                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                                            }}
                                        >
                                            {/* Line number */}
                                            <span style={{
                                                minWidth: "32px",
                                                textAlign: "right",
                                                paddingRight: "12px",
                                                paddingLeft: "12px",
                                                color: "rgba(255,255,255,0.15)",
                                                userSelect: "none",
                                                flexShrink: 0,
                                            }}>{i + 1}</span>
                                            {/* Code */}
                                            <span style={{
                                                color: isComment
                                                    ? "rgba(255,255,255,0.25)"
                                                    : "rgba(255,255,255,0.75)",
                                                fontStyle: isComment ? "italic" : "normal",
                                                wordBreak: "break-all",
                                            }}>
                                                {isCmd && !isComment ? (
                                                    <>
                                                        <span style={{ color: "#33a5c4", fontWeight: 600 }}>{keyword}</span>
                                                        {line.slice(keyword.length)}
                                                    </>
                                                ) : line}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                gap: "12px",
                                paddingTop: "60px",
                                color: "rgba(255,255,255,0.2)",
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polyline points="16 18 22 12 16 6" />
                                <polyline points="8 6 2 12 8 18" />
                            </svg>
                            <span style={{ fontSize: "0.78rem", fontStyle: "italic" }}>No script yet</span>
                        </div>
                    )
                ) : null}
            </div>

            <style>{`
                @keyframes readyGlow {
                    0%, 100% { box-shadow: 0 0 16px rgba(51, 165, 196, 0.2); }
                    50%       { box-shadow: 0 0 32px rgba(51, 165, 196, 0.5); }
                }
                @keyframes resumeGlow {
                    0%, 100% { box-shadow: 0 0 12px rgba(52, 211, 153, 0.15); }
                    50%       { box-shadow: 0 0 24px rgba(52, 211, 153, 0.45); }
                }
                @keyframes shimmer {
                    0%   { left: -100%; }
                    60%  { left: 160%; }
                    100% { left: 160%; }
                }
                .sidebar-scroll::-webkit-scrollbar {
                    width: 3px;
                }
                .sidebar-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .sidebar-scroll::-webkit-scrollbar-thumb {
                    background: rgba(51, 165, 196, 0.25);
                    border-radius: 99px;
                }
                .sidebar-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(51, 165, 196, 0.55);
                }
                .sidebar-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(51, 165, 196, 0.25) transparent;
                }
            `}</style>
        </div>
    );
}



// -- Sub-components --

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{label}</span>
            <button
                onClick={() => onChange(!value)}
                style={{
                    width: "40px",
                    height: "22px",
                    borderRadius: "11px",
                    border: "none",
                    background: value ? "#33a5c4" : "rgba(255,255,255,0.12)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease",
                }}
            >
                <div
                    style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#fff",
                        position: "absolute",
                        top: "3px",
                        left: value ? "21px" : "3px",
                        transition: "left 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                />
            </button>
        </div>
    );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{label}</span>
            {children}
        </div>
    );
}



function SelectInput({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: "6px",
                padding: "5px 10px",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "0.75rem",
                outline: "none",
                cursor: "pointer",
                fontFamily: "inherit",
            }}
        >
            {options.map((opt) => (
                <option key={opt} value={opt} style={{ background: "#1a1a1a" }}>
                    {opt}
                </option>
            ))}
        </select>
    );
}

function ActionButton({ label, variant, onClick }: { label: string; variant: "primary" | "secondary" | "load"; onClick?: () => void }) {
    const styles = {
        primary: {
            border: "none",
            background: "linear-gradient(135deg, #33a5c4, #0ea5e9)",
            color: "#000",
            hoverBg: "linear-gradient(135deg, #33a5c4, #0ea5e9)",
            leaveBg: "linear-gradient(135deg, #33a5c4, #0ea5e9)",
        },
        secondary: {
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.6)",
            hoverBg: "rgba(255,255,255,0.08)",
            leaveBg: "rgba(255,255,255,0.04)",
        },
        load: {
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.85)",
            hoverBg: "rgba(255,255,255,0.16)",
            leaveBg: "rgba(255,255,255,0.1)",
        },
    }[variant];

    const isPrimary = variant === "primary";
    return (
        <button
            onClick={onClick}
            style={{
                padding: "10px",
                fontSize: "0.8rem",
                fontWeight: 600,
                borderRadius: "8px",
                border: styles.border,
                background: styles.background,
                color: styles.color,
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontFamily: "inherit",
                letterSpacing: "0.3px",
                boxShadow: isPrimary ? "0 0 30px rgba(51, 165, 196, 0.3)" : "none",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = styles.hoverBg;
                if (isPrimary) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 40px rgba(51, 165, 196, 0.5)";
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = styles.leaveBg;
                if (isPrimary) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 0 30px rgba(51, 165, 196, 0.3)";
                }
            }}
        >
            {label}
        </button>
    );
}
