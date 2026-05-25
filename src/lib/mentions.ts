/**
 * Extract @mentioned usernames from free text.
 *
 * Usernames are 3-20 chars of [a-z0-9_]. Returns at most 10 unique
 * lowercased names in order of first appearance.
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  return [
    ...new Set(
      [...text.matchAll(/@([a-z0-9_]{3,20})/gi)].map((m) => m[1].toLowerCase()),
    ),
  ].slice(0, 10);
}
