// Extract @mentions from comment text by matching against known user names.
// Names may contain spaces ("@Max Smal"), so we longest-match against the
// user list instead of tokenizing.
export function parseMentions(text: string, userNames: string[]): string[] {
  if (!text.includes("@")) return [];
  const found: string[] = [];
  // Longest first so "@Max Smal" wins over a hypothetical "@Max"
  const sorted = [...userNames].sort((a, b) => b.length - a.length);
  let remaining = text;
  for (const name of sorted) {
    if (!name) continue;
    const token = `@${name}`;
    if (remaining.includes(token)) {
      found.push(name);
      remaining = remaining.split(token).join(" ");
    }
  }
  return found;
}
