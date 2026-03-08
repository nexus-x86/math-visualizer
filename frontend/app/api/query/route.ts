import { NextRequest, NextResponse } from 'next/server';

// Tell Next.js this route can run for up to 5 minutes
export const maxDuration = 300;

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const backendResponse = await fetch(`${BACKEND_URL}/api/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            // @ts-ignore — Node 18+ supports this on its fetch
            signal: AbortSignal.timeout(290_000), // 290 second timeout
        });

        if (!backendResponse.ok) {
            const text = await backendResponse.text();
            return NextResponse.json(
                { error: 'Backend error', details: text },
                { status: backendResponse.status }
            );
        }

        const data = await backendResponse.json();
        return NextResponse.json(data);

    } catch (e: any) {
        console.error('[/api/query] proxy error:', e);
        if (e?.name === 'TimeoutError' || e?.code === 'ECONNRESET') {
            return NextResponse.json(
                { error: 'Request timed out. The pipeline took too long.' },
                { status: 504 }
            );
        }
        return NextResponse.json(
            { error: 'Internal error', details: String(e) },
            { status: 500 }
        );
    }
}
