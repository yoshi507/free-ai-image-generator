# Free AI Image Generator ✨

A beautiful, modern, **100% free & unlimited** AI image generator website.

## Features

- 🎨 Generate high-quality AI images instantly
- ♾️ Completely free and unlimited (no credit card, no limits)
- 🔐 Optional Google Sign-In (works perfectly without any account)
- 🎭 Style presets (Realistic, Anime, Cyberpunk, Fantasy, etc.)
- 📥 Download your creations
- 🕒 Local history of recent generations
- 📱 Fully responsive & mobile-friendly

## Tech Stack

- **Next.js 15** (App Router)
- **Tailwind CSS**
- **Pollinations.ai** (free open image generation – no API key required)

## Why this is free forever

Image generation uses [Pollinations.ai](https://pollinations.ai), an open service that provides free image generation via URL. No backend costs, no API keys, no rate limits for normal use.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy for free (recommended)

### Option 1 – Vercel (best & easiest)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Click Deploy → Done! You get a free `*.vercel.app` URL

## Optional: Real Google Sign-In

The “Sign in with Google” button currently shows a friendly message.  
To enable real auth later:

1. Create a free Google Cloud project
2. Enable Google Identity
3. Add NextAuth.js + Google provider
4. Store history in Supabase (free tier) when logged in

## License

MIT – do whatever you want!
