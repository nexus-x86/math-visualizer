/**
 * AudioPlayer - Singleton that manages an AudioContext unlocked on first user gesture.
 *
 * The browser blocks audio autoplay. The trick: on the first click/tap anywhere on the
 * page, we resume() the AudioContext. After that, all audio plays freely, even from code
 * that isn't directly inside an event handler (like our script runner).
 */

let ctx: AudioContext | null = null;
let unlocked = false;
let activeSource: AudioBufferSourceNode | null = null;
let activeStopFn: (() => void) | null = null;

// ── Pause state ────────────────────────────────────────────────────────────────
let _paused = false;
// Listeners notified when pause state flips so pauseableSleep can unblock.
const _pauseListeners = new Set<() => void>();

function getContext(): AudioContext {
    if (!ctx) {
        ctx = new AudioContext();
    }
    return ctx;
}

/**
 * Call this once on app mount. It registers a one-time click/keydown listener that
 * resumes the AudioContext. After the user's first interaction, audio will play freely.
 */
export function unlockAudioOnInteraction() {
    if (typeof window === 'undefined') return;

    const unlock = async () => {
        if (unlocked) return;
        const context = getContext();
        if (context.state === 'suspended') {
            await context.resume();
        }
        unlocked = true;
        // Clean up listeners after unlock
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    window.addEventListener('keydown', unlock);
}

/**
 * Fetches a TTS audio URL and plays it via AudioContext. Returns a Promise that
 * resolves when the audio finishes (or on error). Blocks mid-playback correctly.
 */
export async function playTTS(url: string): Promise<void> {
    const context = getContext();

    // Resume if suspended (e.g. first interaction already happened but context lazy-suspended)
    if (context.state === 'suspended') {
        try { await context.resume(); } catch (_) { }
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`TTS fetch failed: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    return new Promise<void>((resolve) => {
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);

        activeSource = source;
        activeStopFn = () => {
            try { source.stop(); } catch (_) { }
            resolve();
        };

        source.onended = () => {
            if (activeSource === source) activeSource = null;
            if (activeStopFn === activeStopFn) activeStopFn = null;
            resolve();
        };

        source.start(0);
    });
}

/**
 * Immediately stops the currently playing TTS audio (if any).
 */
export function stopCurrentAudio() {
    if (activeStopFn) {
        const fn = activeStopFn;
        activeSource = null;
        activeStopFn = null;
        fn();
    }
}

/**
 * Pauses audio playback by suspending the AudioContext.
 * The script loop must independently check isPaused() to stall between commands.
 */
export async function pauseCurrentAudio() {
    if (_paused) return;
    _paused = true;
    const context = getContext();
    if (context.state === 'running') {
        try { await context.suspend(); } catch (_) { }
    }
    _pauseListeners.forEach(fn => fn());
}

/**
 * Resumes audio playback by resuming the AudioContext.
 */
export async function resumeCurrentAudio() {
    if (!_paused) return;
    _paused = false;
    const context = getContext();
    if (context.state === 'suspended') {
        try { await context.resume(); } catch (_) { }
    }
    _pauseListeners.forEach(fn => fn());
}

/** Returns whether audio is currently paused. */
export function isAudioPaused() {
    return _paused;
}

/**
 * A sleep that automatically freezes while audio is paused, then resumes after the
 * remaining time once unpaused. Use this instead of plain setTimeout in the script loop.
 */
export function pauseableSleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        let remaining = ms;
        let startedAt = Date.now();
        let timer: ReturnType<typeof setTimeout> | null = null;

        const onPauseChange = () => {
            if (_paused) {
                // Pause: cancel timer, record remaining time
                if (timer !== null) {
                    clearTimeout(timer);
                    timer = null;
                }
                remaining -= Date.now() - startedAt;
            } else {
                // Resume: restart timer with remaining time
                startedAt = Date.now();
                timer = setTimeout(() => {
                    _pauseListeners.delete(onPauseChange);
                    resolve();
                }, Math.max(0, remaining));
            }
        };

        _pauseListeners.add(onPauseChange);

        if (!_paused) {
            // Start immediately
            timer = setTimeout(() => {
                _pauseListeners.delete(onPauseChange);
                resolve();
            }, ms);
        }
        // If already paused, just wait for resume event
    });
}
