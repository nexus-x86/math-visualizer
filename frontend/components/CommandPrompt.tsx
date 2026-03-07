import React, { useState, useRef, useEffect } from 'react';

interface CommandPromptProps {
    onSubmit?: (text: string) => void;
}

export default function CommandPrompt({ onSubmit }: CommandPromptProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize the textarea based on content (expanding downwards because top is anchored)
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '24px'; // Reset height completely first
            const scrollHeight = textareaRef.current.scrollHeight;
            const newHeight = Math.min(Math.max(scrollHeight, 24), 200);
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [text]);

    const handleSend = () => {
        if (text.trim()) {
            if (onSubmit) {
                onSubmit(text);
            } else {
                console.log("Submitted:", text);
            }
            setText('');
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: '40px', /* Positioned at the top */
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            maxWidth: '800px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'flex-start', // Align items to the top so textarea can expand down
            background: 'rgba(30, 30, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '12px 20px',
            border: '1px solid',
            borderColor: isFocused ? 'rgba(20, 184, 166, 0.5)' : 'rgba(255, 255, 255, 0.1)',
            boxShadow: isFocused
                ? '0 8px 32px rgba(20, 184, 166, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.5)',
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
        }}>
            <style>
                {`
                    textarea::-webkit-scrollbar {
                        width: 8px;
                    }
                    textarea::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    textarea::-webkit-scrollbar-thumb {
                        background-color: #555;
                        border-radius: 4px;
                        border: 2px solid rgba(30, 30, 30, 0.8);
                    }
                    textarea::-webkit-scrollbar-thumb:hover {
                        background-color: #777;
                    }
                `}
            </style>
            <span style={{
                color: '#14b8a6',
                marginRight: '12px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                marginTop: '2px' // Align with the first line of the textarea
            }}>
                &gt;&gt;
            </span>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Explain the epsilon delta proofs."
                style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.1rem',
                    outline: 'none',
                    fontFamily: 'monospace',
                    resize: 'none',
                    height: '24px', // Initial height matches one line
                    lineHeight: '24px',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin', // Firefox
                    scrollbarColor: '#555 transparent' // Firefox
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            // Removed onKeyDown submission on Enter
            />
            <button
                onClick={handleSend}
                disabled={!text.trim()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: text.trim() ? '#14b8a6' : '#444',
                    color: text.trim() ? 'black' : '#888',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0 12px',
                    marginLeft: '12px',
                    cursor: text.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s, color 0.2s',
                    height: '32px', // Matches roughly the first line + some padding
                    alignSelf: 'flex-start' // Keep it pinned to the top if text expands
                }}
                aria-label="Send"
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </div>
    );
}
