// Normalize presentation escapes without changing the source records.
export function readingParagraphs(text: string): string[] {
  return text.replace(/\\r\\n|\\n/g, "\n").split(/\r?\n\s*\r?\n/).filter(Boolean);
}
