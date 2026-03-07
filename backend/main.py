from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow CORS for Next.js frontend (default port 3000)
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.post("/api/query")
async def process_query(req: QueryRequest):
    # Process the query here...
    print(f"Received query: {req.query}")
    
    # Return a list of instructions
    return {
        "instructions": [
            {"type": "log", "message": f"Processed query: {req.query}"},
            {"type": "placeholder", "details": "Additional processing steps can go here."}
        ]
    }
