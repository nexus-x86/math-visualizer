"use client";

import { useState, useRef, useEffect } from "react";

interface PromptBarProps {
    onSubmit: (text: string, mode: string) => void;
    isGenerating?: boolean;
    isRunning?: boolean;
    loaded?: boolean;
}

export default function PromptBar({ onSubmit, isGenerating, isRunning = false, loaded = false }: PromptBarProps) {
    const [text, setText] = useState("");
    const [activeMode, _setActiveMode] = useState("animation");
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "28px";
            const sh = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(Math.max(sh, 28), 120)}px`;
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
                transform: loaded && !isRunning
                    ? "translateX(-50%) translateY(0)"
                    : "translateX(-50%) translateY(-20px)",
                width: "70%",
                maxWidth: "700px",
                zIndex: 20,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                opacity: loaded && !isRunning ? 1 : 0,
                pointerEvents: isRunning ? "none" : "auto",
                transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
        >
            {/* Main input */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    background: "rgba(10, 10, 15, 0.9)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    border: "1px solid",
                    borderColor: isFocused ? "rgba(51, 165, 196, 0.5)" : "rgba(255,255,255,0.2)",
                    boxShadow: isFocused
                        ? "0 0 30px rgba(51, 165, 196, 0.2)"
                        : "0 4px 24px rgba(0,0,0,0.4)",
                    transition: "all 0.3s ease",
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g. Explain what is a Riemann sum"
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
                        fontFamily: "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif",
                        overflowY: "auto",
                        letterSpacing: "0.3px",
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
                                ? "linear-gradient(135deg, #33a5c4, #0ea5e9)"
                                : "rgba(255,255,255,0.06)",
                        color: text.trim() && !isGenerating ? "#000" : "rgba(255,255,255,0.2)",
                        cursor: text.trim() && !isGenerating ? "pointer" : "not-allowed",
                        transition: "all 0.2s ease",
                        flexShrink: 0,
                        marginLeft: "10px",
                        boxShadow: text.trim() && !isGenerating ? "0 0 20px rgba(51, 165, 196, 0.3)" : "none",
                    }}
                >
                    {isGenerating ? (
                        <div
                            style={{
                                width: "16px",
                                height: "16px",
                                border: "2px solid rgba(255,255,255,0.15)",
                                borderTop: "2px solid #33a5c4",
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
