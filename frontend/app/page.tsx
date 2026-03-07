"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "system"; content: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log("Received backend instructions:", data.instructions);

      // Just showing a generic response for now, the user requested only log or empty handles
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Received instructions from backend. Check the console.",
        },
      ]);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Failed to connect to the backend. Ensure it is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 rounded-2xl bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 border border-zinc-200">
        <div className="w-full text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Math Visualizer
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Send a query to the backend logic.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 min-h-[300px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-zinc-500">
              No messages yet
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex w-fit max-w-[80%] flex-col rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "self-end bg-blue-600 text-white"
                    : "self-start bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                <span className="text-sm font-semibold mb-1 opacity-70">
                  {msg.role === "user" ? "You" : "System"}
                </span>
                <span className="leading-relaxed">{msg.content}</span>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex w-fit self-start rounded-2xl bg-zinc-200 px-5 py-3 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              <span className="animate-pulse">Loading...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex w-full gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 rounded-xl border border-zinc-300 bg-transparent px-5 py-3 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-900 pointer"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
