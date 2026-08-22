"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Key,
  History,
  BookOpen,
  Download,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  Zap,
} from "lucide-react";

type GeneratedImage = {
  id: string;
  prompt: string;
  url: string;
  createdAt: number;
};

type ApiKey = {
  id: string;
  name: string;
  key: string;
  createdAt: number;
};

const STYLE_PRESETS = [
  { label: "Realistic", value: "photorealistic, highly detailed, 8k" },
  { label: "Anime", value: "anime style, vibrant colors" },
  { label: "Cyberpunk", value: "cyberpunk, neon lights, futuristic" },
  { label: "Fantasy", value: "epic fantasy, magical, detailed" },
  { label: "Oil Painting", value: "oil painting, classical art" },
  { label: "3D Render", value: "3d render, octane, unreal engine" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"generate" | "keys" | "history" | "docs">("generate");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => {
    try {
      const h = localStorage.getItem("pixelforge-history");
      if (h) setHistory(JSON.parse(h));
      const k = localStorage.getItem("pixelforge-keys");
      if (k) setApiKeys(JSON.parse(k));
    } catch {}
  }, []);

  useEffect(() => {
    if (history.length) {
      localStorage.setItem("pixelforge-history", JSON.stringify(history.slice(0, 30)));
    }
  }, [history]);

  useEffect(() => {
    if (apiKeys.length) {
      localStorage.setItem("pixelforge-keys", JSON.stringify(apiKeys));
    }
  }, [apiKeys]);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setCurrentImage(null);

    try {
      const res = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          width: 1024,
          height: 1024,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed");

      const img = new Image();
      img.onload = () => {
        setCurrentImage(data.image_url);
        const item: GeneratedImage = {
          id: crypto.randomUUID(),
          prompt: data.prompt,
          url: data.image_url,
          createdAt: Date.now(),
        };
        setHistory((prev) => [item, ...prev].slice(0, 30));
        setLoading(false);
      };
      img.onerror = () => {
        setError("Image failed to load. Please try again.");
        setLoading(false);
      };
      img.src = data.image_url;
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setLoading(false);
    }
  };

  const createApiKey = () => {
    const name = newKeyName.trim() || `Key ${apiKeys.length + 1}`;
    const key = `sk_live_${crypto.randomUUID().replace(/-/g, "")}`;
    setApiKeys((prev) => [
      { id: crypto.randomUUID(), name, key, createdAt: Date.now() },
      ...prev,
    ]);
    setNewKeyName("");
  };

  const deleteApiKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadImage = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ai-${name.slice(0, 25).replace(/\s+/g, "-")}.png`;
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <header className="border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold tracking-tight">PixelForge</span>
              <span className="ml-2 text-xs text-violet-400 font-medium">API</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: "generate", label: "Generate", icon: ImageIcon },
              { id: "keys", label: "API Keys", icon: Key },
              { id: "history", label: "History", icon: History },
              { id: "docs", label: "Docs", icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="md:hidden border-b border-white/10 flex">
        {[
          { id: "generate", label: "Generate" },
          { id: "keys", label: "API Keys" },
          { id: "history", label: "History" },
          { id: "docs", label: "Docs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === tab.id
                ? "text-violet-400 border-b-2 border-violet-400"
                : "text-white/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "generate" && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Free AI Image Generation
              </h1>
              <p className="text-white/50">
                Unlimited • Completely free • Powered by open models
              </p>
            </div>

            <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 md:p-8">
              <label className="block text-sm font-medium text-white/70 mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A serene Japanese garden at dusk with cherry blossoms, ultra detailed..."
                className="w-full h-28 px-4 py-3 rounded-xl bg-[#0b0f19] border border-white/10 focus:border-violet-500 outline-none resize-none text-white placeholder:text-white/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    generateImage();
                  }
                }}
              />

              <div className="mt-5">
                <label className="block text-sm font-medium text-white/70 mb-3">Style</label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setStyle(style === p.value ? "" : p.value)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        style === p.value
                          ? "bg-violet-600 text-white"
                          : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateImage}
                disabled={loading || !prompt.trim()}
                className="mt-6 w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate Image
                  </>
                )}
              </button>

              {error && <p className="mt-4 text-center text-red-400 text-sm">{error}</p>}
            </div>

            {(currentImage || loading) && (
              <div className="bg-[#121826] border border-white/10 rounded-2xl overflow-hidden">
                <div className="relative aspect-square max-w-xl mx-auto bg-black/40">
                  {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                      <p className="text-white/50 text-sm">Creating your image...</p>
                    </div>
                  ) : (
                    currentImage && (
                      <>
                        <img src={currentImage} alt="Generated" className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <button
                            onClick={() => downloadImage(currentImage, prompt)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/70 hover:bg-black/90 text-sm"
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                          <a
                            href={currentImage}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/70 hover:bg-black/90 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" /> Open
                          </a>
                        </div>
                      </>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "keys" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold mb-1">API Keys</h2>
              <p className="text-white/50 text-sm">
                Create keys to use this service in your own projects
              </p>
            </div>

            <div className="bg-[#121826] border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. My App)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0b0f19] border border-white/10 focus:border-violet-500 outline-none text-sm"
                />
                <button
                  onClick={createApiKey}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" /> Create Key
                </button>
              </div>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p>No API keys yet. Create one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="bg-[#121826] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium">{k.name}</div>
                      <div className="text-xs text-white/40 mt-0.5">
                        Created {new Date(k.createdAt).toLocaleDateString()}
                      </div>
                      <code className="mt-2 block text-xs text-violet-300/80 font-mono truncate max-w-xs">
                        {k.key}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyKey(k.key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm"
                      >
                        {copiedKey === k.key ? (
                          <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy</>
                        )}
                      </button>
                      <button
                        onClick={() => deleteApiKey(k.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/60">
              Keys are stored in your browser. Use them with the API endpoint shown in the Docs tab.
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Generation History</h2>
              <p className="text-white/50 text-sm">Recent images (saved in your browser)</p>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-20 text-white/40">
                <History className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p>No generations yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 cursor-pointer"
                    onClick={() => {
                      setCurrentImage(item.url);
                      setActiveTab("generate");
                    }}
                  >
                    <img
                      src={item.url}
                      alt={item.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-xs line-clamp-2">{item.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "docs" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">API Documentation</h2>
              <p className="text-white/50 text-sm">Use PixelForge in your own projects</p>
            </div>

            <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-400" /> Endpoint
                </h3>
                <code className="block bg-[#0b0f19] px-4 py-3 rounded-lg text-sm text-violet-300 font-mono">
                  POST /api/v1/generate
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example</h3>
                <pre className="bg-[#0b0f19] p-4 rounded-lg text-sm overflow-x-auto text-green-300/90">
{`curl -X POST https://your-site.vercel.app/api/v1/generate \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "a cute robot cat"}'`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response</h3>
                <pre className="bg-[#0b0f19] p-4 rounded-lg text-sm overflow-x-auto text-white/80">
{`{
  "success": true,
  "image_url": "https://image.pollinations.ai/...",
  "prompt": "a cute robot cat"
}`}
                </pre>
              </div>
            </div>

            <div className="bg-[#121826] border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-3">Who generates the images?</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Images are generated by <strong className="text-white">Pollinations.ai</strong> — 
                a free open community service running models like Flux. That’s why everything stays free.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/40">
        <p>PixelForge — Free AI Image API</p>
        <p className="mt-1">Powered by Pollinations.ai</p>
      </footer>
    </div>
  );
}
