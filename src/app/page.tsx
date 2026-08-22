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
import { STYLE_PRESETS, buildImageUrl } from "@/lib/pollinations";

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

type Tab = "generate" | "keys" | "history" | "docs";

const TABS: { id: Tab; label: string; icon: typeof ImageIcon }[] = [
  { id: "generate", label: "Generate", icon: ImageIcon },
  { id: "keys", label: "API Keys", icon: Key },
  { id: "history", label: "History", icon: History },
  { id: "docs", label: "Docs", icon: BookOpen },
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function preload(src: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("generate");
  const [hydrated, setHydrated] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keyName, setKeyName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      const h = localStorage.getItem("pixelforge-history");
      if (h) setHistory(JSON.parse(h));
      const k = localStorage.getItem("pixelforge-keys");
      if (k) setApiKeys(JSON.parse(k));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("pixelforge-history", JSON.stringify(history.slice(0, 36)));
  }, [history, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("pixelforge-keys", JSON.stringify(apiKeys));
  }, [apiKeys, hydrated]);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setCurrentUrl(null);
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
      if (!res.ok || !data.success || !data.image_url) {
        throw new Error(data.error || "Generation failed");
      }
      await preload(data.image_url);
      setCurrentUrl(data.image_url);
      setHistory((prev) =>
        [
          {
            id: crypto.randomUUID(),
            prompt: data.prompt || prompt,
            url: data.image_url,
            createdAt: Date.now(),
          },
          ...prev,
        ].slice(0, 36)
      );
    } catch (err) {
      const fallback = buildImageUrl({ prompt, style });
      try {
        await preload(fallback.url);
        setCurrentUrl(fallback.url);
        setHistory((prev) =>
          [
            {
              id: crypto.randomUUID(),
              prompt: fallback.fullPrompt,
              url: fallback.url,
              createdAt: Date.now(),
            },
            ...prev,
          ].slice(0, 36)
        );
      } catch {
        setError(err instanceof Error ? err.message : "Could not generate image");
      }
    } finally {
      setLoading(false);
    }
  }

  function createKey() {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const key: ApiKey = {
      id: crypto.randomUUID(),
      name: keyName.trim() || `Key ${apiKeys.length + 1}`,
      key: `sk_live_${hex}`,
      createdAt: Date.now(),
    };
    setApiKeys((prev) => [key, ...prev]);
    setKeyName("");
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopied(text);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function download(url: string, name: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pixelforge-${name.slice(0, 24).replace(/\s+/g, "-")}.png`;
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border-strong bg-subtle">
              <Sparkles className="size-4 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg leading-tight tracking-tight">
                PixelForge
              </p>
              <p className="text-xs text-faint">Image API</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  tab === item.id
                    ? "bg-subtle text-fg"
                    : "text-muted hover:text-fg hover:bg-subtle/60"
                )}
              >
                <item.icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex md:hidden border-t border-border">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex-1 h-12 text-sm font-medium",
                tab === item.id
                  ? "text-fg border-b-2 border-primary"
                  : "text-faint"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {tab === "generate" && (
          <section className="space-y-8">
            <div className="max-w-xl">
              <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl tracking-tight leading-tight">
                Still images, on demand
              </h1>
              <p className="mt-3 text-muted leading-relaxed">
                Describe a scene. PixelForge returns a still from open models —
                free, unlimited, no account.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
              <label className="block text-sm font-medium text-muted mb-2" htmlFor="prompt">
                Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A quiet reading room at dusk, oak shelves, a single lamp, dust in the air"
                className="min-h-28 w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm text-fg placeholder:text-faint resize-none focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void generate();
                  }
                }}
              />
              <p className="mt-5 mb-3 text-sm font-medium text-muted">Style</p>
              <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setStyle(style === preset.value ? "" : preset.value)
                    }
                    className={cn(
                      "h-10 px-3 rounded-lg text-sm font-medium border transition-colors",
                      style === preset.value
                        ? "bg-primary text-primary-fg border-primary"
                        : "bg-subtle text-muted border-border hover:text-fg"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={loading || !prompt.trim()}
                onClick={() => void generate()}
                className="mt-6 w-full h-12 rounded-xl font-semibold bg-primary text-primary-fg hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <span className="size-4 rounded-full border-2 border-primary-fg/30 border-t-primary-fg animate-spin" />
                    Rendering
                  </>
                ) : (
                  <>
                    <Zap className="size-4" strokeWidth={1.75} />
                    Generate
                  </>
                )}
              </button>
              {error && (
                <p className="mt-4 text-center text-sm text-danger">{error}</p>
              )}
            </div>

            {(currentUrl || loading) && (
              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="relative aspect-square max-w-xl mx-auto bg-subtle">
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="size-10 rounded-full border-2 border-border-strong border-t-primary animate-spin" />
                      <p className="text-sm text-muted">Composing the frame</p>
                    </div>
                  )}
                  {currentUrl && !loading && (
                    <>
                      <img
                        src={currentUrl}
                        alt="Generated still"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void download(currentUrl, prompt)}
                          className="flex h-10 items-center gap-1.5 rounded-lg bg-bg/80 border border-border px-3 text-sm backdrop-blur hover:bg-bg"
                        >
                          <Download className="size-4" /> Download
                        </button>
                        <a
                          href={currentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 items-center gap-1.5 rounded-lg bg-bg/80 border border-border px-3 text-sm backdrop-blur hover:bg-bg"
                        >
                          <ExternalLink className="size-4" /> Open
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "keys" && (
          <section className="mx-auto max-w-2xl space-y-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                API keys
              </h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Issue a key, then call the generate endpoint from your own app.
                Keys stay in this browser.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Key name, e.g. Studio script"
                  className="h-11 flex-1 rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-faint focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createKey();
                  }}
                />
                <button
                  type="button"
                  onClick={createKey}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-fg hover:opacity-90"
                >
                  <Plus className="size-4" /> Create key
                </button>
              </div>
            </div>
            {!hydrated ? (
              <div className="h-32 rounded-xl bg-subtle animate-pulse" />
            ) : apiKeys.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface py-16 text-center">
                <Key className="mx-auto size-8 text-faint" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-muted">No keys yet</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {apiKeys.map((k) => (
                  <li
                    key={k.id}
                    className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{k.name}</p>
                      <p className="text-xs text-faint mt-0.5 tabular-nums">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </p>
                      <code className="mt-2 block truncate text-xs font-mono text-muted">
                        {k.key}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copy(k.key)}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-subtle px-3 text-sm hover:border-border-strong"
                      >
                        {copied === k.key ? (
                          <Check className="size-4 text-ok" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                        {copied === k.key ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        aria-label="Delete key"
                        onClick={() =>
                          setApiKeys((prev) => prev.filter((x) => x.id !== k.id))
                        }
                        className="flex size-9 items-center justify-center rounded-lg hover:bg-danger/15"
                      >
                        <Trash2 className="size-4 text-danger" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "history" && (
          <section className="space-y-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                History
              </h2>
              <p className="mt-2 text-sm text-muted">
                Recent stills from this browser
              </p>
            </div>
            {!hydrated ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-subtle animate-pulse"
                  />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface py-20 text-center">
                <History className="mx-auto size-8 text-faint" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-muted">Nothing generated yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-subtle text-left"
                    onClick={() => {
                      setCurrentUrl(item.url);
                      setPrompt(item.prompt);
                      setTab("generate");
                    }}
                  >
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 to-transparent p-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                      {item.prompt}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "docs" && (
          <section className="mx-auto max-w-2xl space-y-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                API
              </h2>
              <p className="mt-2 text-sm text-muted">
                Call PixelForge from any client that can POST JSON.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
              <div>
                <p className="text-sm font-medium text-muted mb-2">Endpoint</p>
                <code className="block rounded-xl bg-bg border border-border px-3 py-3 text-sm font-mono text-fg">
                  POST /api/v1/generate
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-2">Body</p>
                <pre className="rounded-xl bg-bg border border-border px-3 py-3 text-sm font-mono text-muted overflow-x-auto">{`{
  "prompt": "a quiet harbour at dawn",
  "style": "editorial photography",
  "width": 1024,
  "height": 1024
}`}</pre>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-2">
                  Header (optional)
                </p>
                <pre className="rounded-xl bg-bg border border-border px-3 py-3 text-sm font-mono text-muted overflow-x-auto">
                  Authorization: Bearer sk_live_…
                </pre>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="font-medium">Who renders the image</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Frames are produced by Pollinations, a public open-model service
                (Flux and related checkpoints). PixelForge does not bill for
                generation and does not require an account.
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-faint">
        PixelForge · open models via Pollinations
      </footer>
    </div>
  );
}
