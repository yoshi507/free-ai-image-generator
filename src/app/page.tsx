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
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Image as ImageIcon,
  Zap,
  Mail,
  X,
} from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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
  lastUsed?: number;
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

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sendingLink, setSendingLink] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();

    try {
      const h = localStorage.getItem("ai-img-history");
      if (h) setHistory(JSON.parse(h));
      const k = localStorage.getItem("ai-img-keys");
      if (k) setApiKeys(JSON.parse(k));
    } catch {}

    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (history.length) localStorage.setItem("ai-img-history", JSON.stringify(history.slice(0, 30)));
  }, [history]);

  useEffect(() => {
    if (apiKeys.length) localStorage.setItem("ai-img-keys", JSON.stringify(apiKeys));
  }, [apiKeys]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);

    if (!email.trim()) {
      setAuthError("Please enter your email");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setAuthError("Supabase is not configured. Add the environment variables in Vercel.");
      return;
    }

    setSendingLink(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setSendingLink(false);

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage("Check your email for the magic link! ✨");
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

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
        setError("Image failed to load. Try again.");
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
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name,
      key,
      createdAt: Date.now(),
    };
    setApiKeys((prev) => [newKey, ...prev]);
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

          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/70 hidden sm:inline truncate max-w-[140px]">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="md:hidden border-b border-white/10 flex overflow-x-auto">
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

      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121826] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowLogin(false);
                setAuthMessage(null);
                setAuthError(null);
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold">Sign in with Email</h2>
              <p className="text-sm text-white/50 mt-1">
                We’ll send you a magic link — no password needed
              </p>
            </div>

            {!isSupabaseConfigured ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200">
                <p className="font-medium mb-1">Supabase not connected yet</p>
                <p className="text-amber-200/80">
                  Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                  <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your Vercel
                  environment variables, then redeploy.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#0b0f19] border border-white/10 focus:border-violet-500 outline-none text-sm"
                    required
                  />
                </div>

                {authError && (
                  <p className="text-sm text-red-400">{authError}</p>
                )}
                {authMessage && (
                  <p className="text-sm text-green-400">{authMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={sendingLink}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingLink ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Magic Link
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "generate" && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Free AI Image Generation
              </h1>
              <p className="text-white/50">
                Unlimited • No account required • Powered by open models
              </p>
            </div>

            <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
              <label className="block text-sm font-medium text-white/70 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A serene Japanese garden at dusk with cherry blossoms, ultra detailed, cinematic lighting..."
                className="w-full h-28 px-4 py-3 rounded-xl bg-[#0b0f19] border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none resize-none text-white placeholder:text-white/30 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    generateImage();
                  }
                }}
              />

              <div className="mt-5">
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Style
                </label>
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
                className="mt-6 w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
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

              {error && (
                <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
              )}
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
                        <img
                          src={currentImage}
                          alt="Generated"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <button
                            onClick={() => downloadImage(currentImage, prompt)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/70 hover:bg-black/90 text-sm backdrop-blur"
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                          <a
                            href={currentImage}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/70 hover:bg-black/90 text-sm backdrop-blur"
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
                Create keys to use PixelForge in your own apps, scripts, or websites.
              </p>
            </div>

            {!user && (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-sm text-violet-200 flex items-center justify-between gap-4">
                <span>Sign in to save your API keys across devices.</span>
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium whitespace-nowrap"
                >
                  Sign in
                </button>
              </div>
            )}

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
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium text-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Create Key
                </button>
              </div>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p>No API keys yet. Create one to get started.</p>
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
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
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
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Generation History</h2>
              <p className="text-white/50 text-sm">Your recent images</p>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-20 text-white/40">
                <History className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p>No generations yet. Create something beautiful!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#121826] cursor-pointer"
                    onClick={() => {
                      setCurrentImage(item.url);
                      setActiveTab("generate");
                    }}
                  >
                    <img
                      src={item.url}
                      alt={item.prompt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
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
              <p className="text-white/50 text-sm">
                Use PixelForge in your own projects
              </p>
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
                <h3 className="font-semibold mb-2">Request Body</h3>
                <pre className="bg-[#0b0f19] p-4 rounded-lg text-sm overflow-x-auto text-white/80">
{`{
  "prompt": "a futuristic city at night",
  "style": "cyberpunk, neon",
  "width": 1024,
  "height": 1024,
  "model": "flux"
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Headers (optional)</h3>
                <pre className="bg-[#0b0f19] p-4 rounded-lg text-sm text-white/80">
{`Authorization: Bearer sk_live_your_api_key_here
Content-Type: application/json`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example (curl)</h3>
                <pre className="bg-[#0b0f19] p-4 rounded-lg text-sm overflow-x-auto text-green-300/90">
{`curl -X POST https://your-domain.vercel.app/api/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk_live_xxxxx" \\
  -d '{"prompt": "a cute robot cat"}'`}
                </pre>
              </div>
            </div>

            <div className="bg-[#121826] border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-3">Who generates the images?</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Images are generated by{" "}
                <strong className="text-white">Pollinations.ai</strong> — a free,
                open community service that runs models like Flux. This keeps
                PixelForge completely free for everyone.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/40">
        <p>PixelForge — Free AI Image API • Powered by Pollinations.ai</p>
        <p className="mt-1">Made with ❤️ for builders</p>
      </footer>
    </div>
  );
}
