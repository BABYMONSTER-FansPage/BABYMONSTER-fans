export function translationResult(original: string, translated?: string | null) {
  const clean = translated?.trim();
  return clean ? { text: clean, original, fallback: false } : { text: original, original, fallback: true };
}
