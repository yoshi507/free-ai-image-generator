# PixelForge — Free AI Image Generation API

A clean, professional free AI image generator with its own API keys.

## Features

- Generate unlimited AI images for free
- Create & manage API keys (stored in your browser)
- Generation history
- Full API documentation
- No accounts, no paid services, no environment variables

## Who generates the images?

**[Pollinations.ai](https://pollinations.ai)** — free open models (Flux and related).

## Deploy for free (no upgrade needed)

1. Open [vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New Project** → import `yoshi507/free-ai-image-generator`
3. Click **Deploy** (leave env vars empty)
4. You get a live `*.vercel.app` URL with the API working

Every push to `main` redeploys automatically.

## API

```bash
curl -X POST https://YOUR-SITE.vercel.app/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a quiet harbour at dawn"}'
```

Optional header: `Authorization: Bearer sk_live_...` (keys from the in-app API Keys tab).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
