"use client";

import React, { useState, useRef, useEffect } from "react";

interface PromptBarProps {
    onSubmit: (text: string, mode: string) => void;
    isGenerating?: boolean;
}

const MODES = [
    { id: "step-by-step", label: "Step by Step", icon: "📐" },
    { id: "explain", label: "Explain", icon: "💡" },
    { id: "animation", label: "Animation", icon: "🎬" },
    { id: "solve", label: "Solve Problem", icon: "🧮" },
];

export default function PromptBar({ onSubmit, isGenerating }: PromptBarProps) {
    const [text, setText] = useState("");
    const [activeMode, setActiveMode] = useState("animation");
    const [isFocused, setIsFocused] = useState(false);
    const [detectedTopic, setDetectedTopic] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "28px";
            const sh = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(Math.max(sh, 28), 120)}px`;
        }
    }, [text]);

    // Simple topic detection
    useEffect(() => {
        const lower = text.toLowerCase();
        if (lower.includes("vector") || lower.includes("linear algebra") || lower.includes("matrix")) {
            setDetectedTopic("Linear Algebra");
        } else if (lower.includes("calculus") || lower.includes("integral") || lower.includes("derivative")) {
            setDetectedTopic("Calculus");
        } else if (lower.includes("probability") || lower.includes("statistics")) {
            setDetectedTopic("Probability");
        } else if (lower.includes("geometry") || lower.includes("triangle") || lower.includes("circle")) {
            setDetectedTopic("Geometry");
        } else {
            setDetectedTopic("");
        }
    }, [text]);

    const handleSend = () => {
        if (text.trim() && !isGenerating) {
            onSubmit(text, activeMode);
            setText("");
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                top: "24px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "70%",
                maxWidth: "700px",
                zIndex: 20,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
            }}
        >
            {/* Main input */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    background: "rgba(15, 15, 22, 0.85)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    border: "1px solid",
                    borderColor: isFocused ? "rgba(20, 184, 166, 0.4)" : "rgba(255,255,255,0.08)",
                    boxShadow: isFocused
                        ? "0 8px 40px rgba(20, 184, 166, 0.15)"
                        : "0 4px 24px rgba(0,0,0,0.4)",
                    transition: "all 0.3s ease",
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Describe what you'd like to see..."
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        color: "#e2e8f0",
                        fontSize: "0.95rem",
                        outline: "none",
                        resize: "none",
                        height: "28px",
                        lineHeight: "28px",
                        fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
                        overflowY: "auto",
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || isGenerating}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        border: "none",
                        background:
                            text.trim() && !isGenerating
                                ? "linear-gradient(135deg, #14b8a6, #0ea5e9)"
                                : "rgba(255,255,255,0.06)",
                        color: text.trim() && !isGenerating ? "#000" : "rgba(255,255,255,0.2)",
                        cursor: text.trim() && !isGenerating ? "pointer" : "not-allowed",
                        transition: "all 0.2s ease",
                        flexShrink: 0,
                        marginLeft: "10px",
                    }}
                >
                    {isGenerating ? (
                        <div
                            style={{
                                width: "16px",
                                height: "16px",
                                border: "2px solid rgba(255,255,255,0.15)",
                                borderTop: "2px solid #14b8a6",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                            }}
                        />
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mode pills + topic tag */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", paddingLeft: "4px" }}>
                {MODES.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => setActiveMode(mode.id)}
                        style={{
                            padding: "6px 14px",
                            fontSize: "0.72rem",
                            fontWeight: activeMode === mode.id ? 600 : 400,
                            borderRadius: "20px",
                            border: activeMode === mode.id ? "1px solid #14b8a6" : "1px solid rgba(255,255,255,0.1)",
                            background:
                                activeMode === mode.id
                                    ? "rgba(20, 184, 166, 0.15)"
                                    : "rgba(255,255,255,0.04)",
                            color: activeMode === mode.id ? "#14b8a6" : "rgba(255,255,255,0.45)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontFamily: "inherit",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                        }}
                    >
                        <span style={{ fontSize: "0.8rem" }}>{mode.icon}</span>
                        {mode.label}
                    </button>
                ))}

                {detectedTopic && (
                    <span
                        style={{
                            padding: "5px 12px",
                            fontSize: "0.7rem",
                            borderRadius: "16px",
                            background: "rgba(20, 184, 166, 0.1)",
                            color: "#14b8a6",
                            border: "1px solid rgba(20, 184, 166, 0.2)",
                            marginLeft: "auto",
                            fontWeight: 500,
                            animation: "fadeIn 0.3s ease",
                        }}
                    >
                        {detectedTopic}
                    </span>
                )}
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
}
