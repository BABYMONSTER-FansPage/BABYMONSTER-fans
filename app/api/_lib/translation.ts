import { env } from "cloudflare:workers";

const languageMap: Record<string, string> = {
  "zh-TW": "zt", "zh-CN": "zh", th: "th", en: "en", ko: "ko", ja: "ja",
};

export function translationLanguage(locale: string) {
  return languageMap[locale] || "en";
}

export async function translateText(text: string, source: string, target: string) {
  const runtime = env as unknown as Record<string, string | undefined>;
  const endpoint = runtime.TRANSLATION_API_URL;
  if (!endpoint) throw new Error("TRANSLATION_NOT_CONFIGURED");
  const response = await fetch(`${endpoint.replace(/\/$/, "")}/translate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ q: text, source: translationLanguage(source), target: translationLanguage(target), format: "text", api_key: runtime.TRANSLATION_API_KEY || undefined }),
  });
  if (!response.ok) throw new Error(`TRANSLATION_FAILED_${response.status}`);
  const data = await response.json() as { translatedText?: string };
  if (!data.translatedText) throw new Error("TRANSLATION_EMPTY");
  return data.translatedText;
}
