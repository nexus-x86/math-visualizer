import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // In Docker, you might want to configure this. For local, localhost:8000.
        // On mac with docker-compose, this might need to be resolved via the service name.
        // Actually since this is a server-side fetch from the frontend container, it needs to hit the backend container.
        // If not using docker, localhost:8000 works.
        const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
        console.log("Fetching to backend URL:", backendUrl);
        const response = await fetch(`${backendUrl}/api/query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Backend returned status ${response.status}`);
        }

        const data = await response.json();

        // Backend returns { instructions: string[] } where each string is a script line.
        // Join them back into a single script string for the frontend textarea.
        const script = (data.instructions || []).join("\n");

        return NextResponse.json({ script });
    } catch (error) {
        console.error("Error proxying to backend:", error);
        return NextResponse.json(
            { error: "Failed to fetch from backend" },
            { status: 500 }
        );
    }
}