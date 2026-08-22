import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, style = "", width = 1024, height = 1024, model = "flux" } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 2) {
      return NextResponse.json(
        { error: "Prompt is required and must be at least 2 characters" },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : body.api_key || null;

    const fullPrompt = style ? `${prompt.trim()}, ${style}` : prompt.trim();
    const seed = Math.floor(Math.random() * 1_000_000);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      fullPrompt
    )}?width=${width}&height=${height}&nologo=true&model=${model}&seed=${seed}&enhance=true`;

    return NextResponse.json({
      success: true,
      image_url: imageUrl,
      prompt: fullPrompt,
      model,
      width,
      height,
      seed,
      api_key_used: apiKey ? true : false,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return NextResponse.json(
      {
        message: "Free AI Image Generation API",
        usage: "POST /api/v1/generate with JSON { prompt, style?, width?, height? }",
        auth: "Optional: Authorization: Bearer YOUR_API_KEY",
        example: "/api/v1/generate?prompt=a%20cute%20cat",
      },
      { status: 200 }
    );
  }

  const seed = Math.floor(Math.random() * 1_000_000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}&enhance=true`;

  return NextResponse.json({
    success: true,
    image_url: imageUrl,
    prompt,
  });
}
