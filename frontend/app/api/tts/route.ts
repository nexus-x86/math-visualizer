import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');

    if (!text) {
        return new NextResponse("Missing text parameter", { status: 400 });
    }

    const apiKey = process.env.ELEVENLAB_KEY;
    // Common default voice (e.g., George or Rachel)
    const voiceId = "uh5qBlKfjqFl7XXhFnJi";

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
            method: "POST",
            headers: {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": apiKey || ""
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_turbo_v2_5",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("ElevenLabs error:", err);
            return new NextResponse("TTS generation failed", { status: response.status });
        }

        return new NextResponse(response.body, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache",
            }
        });
    } catch (e) {
        console.error("API route TTS error:", e);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
