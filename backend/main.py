import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import httpx

from backend.pipeline import run_pipeline

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "ok", "message": "Math Visualizer API is running"}

# Allow CORS for Next.js frontend (default port 3000)
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str

@app.post("/")
@app.post("/api/query")
async def process_query(req: QueryRequest):
    print(f"Received query: {req.query}")
    
    # Run the blocking Gemini pipeline in a thread pool so it doesn't block
    # the event loop and starve other incoming requests.
    script = await asyncio.to_thread(run_pipeline, req.query)
    
    instructions = [line.strip() for line in script.splitlines() if line.strip()]
    
    return {
        "script": script,
        "instructions": instructions
    }


@app.get("/api/tts")
async def text_to_speech(text: str):
    api_key = os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVENLAB_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")

    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "uh5qBlKfjqFl7XXhFnJi")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key,
    }
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.5},
    }

    async def generate():
        async with httpx.AsyncClient(timeout=30) as client:
            async with client.stream("POST", url, json=data, headers=headers) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    raise HTTPException(status_code=resp.status_code, detail=body.decode())
                async for chunk in resp.aiter_bytes():
                    yield chunk

    return StreamingResponse(generate(), media_type="audio/mpeg")



