"use client";

import { useState, useEffect } from "react";

type GeneratedImage = {
  id: string;
  prompt: string;
  url: string;
  createdAt: number;
};

const STYLE_PRESETS = [
  { label: "Realistic", value: "photorealistic, highly detailed, 8k" },
  { label: "Anime", value: "anime style, vibrant colors, studio ghibli" },
  { label: "Cyberpunk", value: "cyberpunk, neon lights, futuristic city" },
  { label: "Fantasy", value: "epic fantasy, magical, detailed illustration" },
  { label: "Oil Painting", value: "oil painting, classical art style, masterpiece" },
  { label: "3D Render", value: "3d render, octane render, unreal engine" },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai-image-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save history
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("ai-image-history", JSON.stringify(history.slice(0, 20)));
    }
  }, [history]);

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentImage(null);

    const fullPrompt = style
      ? `${prompt.trim()}, ${style}`
      : prompt.trim();

    // Pollinations.ai — completely free, no API key, unlimited fair use
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      fullPrompt
    )}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}&enhance=true`;

    // Preload the image
    const img = new Image();
    img.onload = () => {
      setCurrentImage(imageUrl);
      const newItem: GeneratedImage = {
        id: crypto.randomUUID(),
        prompt: fullPrompt,
        url: imageUrl,
        createdAt: Date.now(),
      };
      setHistory((prev) => [newItem, ...prev].slice(0, 20));
      setLoading(false);
    };
    img.onerror = () => {
      setError("Failed to generate image. Please try again in a moment!");
      setLoading(false);
    };
    img.src = imageUrl;
  };

  const downloadImage = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ai-image-${name.slice(0, 30).replace(/\s+/g, "-")}.png`;
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-black/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-violet-500/30">
              ✨
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Free AI Image Generator</h1>
              <p className="text-xs text-white/60">100% free • Unlimited • No account needed</p>
            </div>
          </div>

          {/* Optional Google sign-in button */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm transition-all"
            onClick={() =>
              alert(
                "Google Sign-In is optional!\n\nYou can generate unlimited images right now without any account.\n\nFull Google auth can be added later with NextAuth + Google provider (requires free Google Cloud credentials)."
              )
            }
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Hero / Generator Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-violet-500/10 mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">
            Create anything you imagine 🎨
          </h2>
          <p className="text-center text-white/60 mb-8">
            Powered by free open models • No limits • No credit card
          </p>

          {/* Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Describe your image
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A majestic dragon flying over a neon cyberpunk city at sunset, ultra detailed..."
              className="w-full h-28 px-4 py-3 rounded-2xl bg-black/40 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 outline-none resize-none text-white placeholder:text-white/40 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateImage();
                }
              }}
            />
          </div>

          {/* Style presets */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-white/80 mb-3">
              Style (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() =>
                    setStyle(style === preset.value ? "" : preset.value)
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    style === preset.value
                      ? "bg-violet-500 text-white shadow-lg shadow-violet-500/40"
                      : "bg-white/10 hover:bg-white/20 text-white/80"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generateImage}
            disabled={loading || !prompt.trim()}
            className="w-full py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-violet-500/30 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating your masterpiece...
              </>
            ) : (
              <>✨ Generate Free Image</>
            )}
          </button>

          {error && (
            <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Current result */}
        {(currentImage || loading) && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-4">Your creation</h3>
            <div className="relative bg-black/40 rounded-3xl overflow-hidden border border-white/10 aspect-square max-w-2xl mx-auto">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                  <p className="text-white/60">Creating magic...</p>
                </div>
              ) : (
                currentImage && (
                  <>
                    <img
                      src={currentImage}
                      alt="Generated AI image"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button
                        onClick={() => downloadImage(currentImage, prompt)}
                        className="px-4 py-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur text-sm font-medium transition-all"
                      >
                        ⬇️ Download
                      </button>
                      <a
                        href={currentImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur text-sm font-medium transition-all"
                      >
                        🔗 Open
                      </a>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Recent generations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/30 cursor-pointer"
                  onClick={() => setCurrentImage(item.url)}
                >
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-xs line-clamp-2">{item.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-sm text-white/50">
        <p>
          100% free forever • Powered by open models via Pollinations.ai • No
          account required
        </p>
        <p className="mt-1">Made with ❤️ for unlimited creativity</p>
      </footer>
    </div>
  );
}
