export const STYLE_PRESETS = [
  { label: "Documentary", value: "photorealistic, highly detailed, natural light, 8k" },
  { label: "Editorial", value: "editorial photography, cinematic lighting, film grain" },
  { label: "Ink", value: "ink wash illustration, fine linework, paper texture" },
  { label: "Studio", value: "studio product shot, softbox lighting, clean backdrop" },
  { label: "Noir", value: "black and white noir, high contrast, dramatic shadows" },
  { label: "Render", value: "3d render, octane, physically based materials" },
] as const;

export type GenerateParams = {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  model?: string;
  seed?: number;
};

export function buildImageUrl(params: GenerateParams) {
  const fullPrompt = params.style
    ? `${params.prompt.trim()}, ${params.style}`
    : params.prompt.trim();
  const seed = params.seed ?? Math.floor(Math.random() * 1_000_000);
  const width = params.width ?? 1024;
  const height = params.height ?? 1024;
  const model = params.model ?? "flux";
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    fullPrompt
  )}?width=${width}&height=${height}&nologo=true&model=${model}&seed=${seed}&enhance=true`;
  return { url, seed, fullPrompt };
}
