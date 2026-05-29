const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0f766e"/>
  <path fill="#fff" d="M18 42h22c4.2 0 7-2.3 7-5.9 0-3-1.8-4.8-5.4-6.1l-10.3-3.6c-1.8-.6-2.6-1.3-2.6-2.5 0-1.5 1.3-2.4 3.5-2.4h12.6v-6.2H31.6c-6.1 0-10.1 3.3-10.1 8.5 0 3.8 2.1 6.4 6.7 8l10 3.5c1.4.5 2 1 2 2 0 1.2-1 1.9-2.8 1.9H18V42Z"/>
</svg>`;

export const dynamic = "force-static";

export function GET() {
  return new Response(icon, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/svg+xml"
    }
  });
}
