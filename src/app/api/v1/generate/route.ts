import { NextRequest, NextResponse } from "next/server";
import { buildImageUrl } from "@/lib/pollinations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    if (prompt.trim().length < 2) {
      return NextResponse.json(
        { error: "Prompt is required and must be at least 2 characters" },
        { status: 400 }
      );
    }

    const style = typeof body.style === "string" ? body.style : "";
    const width = typeof body.width === "number" ? body.width : 1024;
    const height = typeof body.height === "number" ? body.height : 1024;
    const model = typeof body.model === "string" ? body.model : "flux";

    const authHeader = req.headers.get("authorization");
    const apiKeyUsed = Boolean(authHeader?.startsWith("Bearer "));

    const result = buildImageUrl({ prompt, style, width, height, model });

    return NextResponse.json({
      success: true,
      image_url: result.url,
      prompt: result.fullPrompt,
      model,
      width,
      height,
      seed: result.seed,
      api_key_used: apiKeyUsed,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return NextResponse.json({
      message: "PixelForge image API",
      usage: "POST /api/v1/generate with JSON { prompt, style?, width?, height? }",
      auth: "Optional: Authorization: Bearer YOUR_API_KEY",
    });
  }

  const result = buildImageUrl({ prompt });
  return NextResponse.json({
    success: true,
    image_url: result.url,
    prompt: result.fullPrompt,
    seed: result.seed,
  });
}
