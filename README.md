# PixelForge — Free AI Image Generation API

Professional free AI image generator with built-in API keys.

## Features

- Unlimited free image generation (Pollinations / Flux)
- Create & manage API keys (browser localStorage)
- Generation history
- Full API docs
- No accounts, no env vars, no paid services

## Deploy free on Vercel

1. Import this repo on [vercel.com](https://vercel.com) (GitHub sign-in)
2. Deploy with empty environment variables
3. Live at `*.vercel.app`

## API

```bash
curl -X POST https://YOUR-SITE.vercel.app/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a quiet harbour at dawn"}'
```

## Local

```bash
npm install
npm run dev
```
