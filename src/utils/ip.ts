export function getIpAddress(request: Request): string {
  const headers = request.headers;
  // x-forwarded-for
  // CloudFlare
  // Vercel
  return headers.get("x-forwarded-for") || headers.get("cf-connecting-ip") || headers.get("x-real-ip") || "127.0.0.1";
}
