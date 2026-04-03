/**
 * Always use the Next.js proxy (`/api/...`).
 * next.config.ts rewrites those to the CloudHub backend.
 */
export function getApiBase(): string {
  return "";
}
