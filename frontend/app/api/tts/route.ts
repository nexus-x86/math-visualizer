import { NextRequest, NextResponse } from 'next/server';

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? 'uh5qBlKfjqFl7XXhFnJi';

export async function GET(req: NextRequest) {
    const text = req.nextUrl.searchParams.get('text');
    if (!text) {
        return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLAB_KEY;
    if (!apiKey) {
        console.error('[/api/tts] ElevenLabs API key not set');
        return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    // Use the streaming endpoint so audio starts playing immediately
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;

    try {
        const upstream = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: { stability: 0.5, similarity_boost: 0.5 },
            }),
        });

        if (!upstream.ok) {
            const details = await upstream.text();
            console.error(`[/api/tts] ElevenLabs error ${upstream.status}:`, details);
            return new NextResponse(details, { status: upstream.status });
        }

        // Pipe the upstream body directly — no buffering
        return new NextResponse(upstream.body, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Transfer-Encoding': 'chunked',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (e: any) {
        console.error('[/api/tts] Internal error:', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

