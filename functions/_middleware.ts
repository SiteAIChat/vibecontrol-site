// getvibecontrol.com is the canonical host. www.getvibecontrol.com is attached
// to this Pages project so it gets a certificate, and every request to it is
// permanently redirected here (path and query preserved), the same way
// fire-your-website.com handles its www host (GetVibeControl/vibecontrol#3019).
//
// A Pages Function rather than Astro middleware because this site is
// `output: 'static'`; Pages runs functions/_middleware before static assets.
const CANONICAL_HOST = 'getvibecontrol.com';
const REDIRECT_HOSTS = new Set([`www.${CANONICAL_HOST}`]);

export async function onRequest(context: { request: Request; next: () => Promise<Response> }) {
  const url = new URL(context.request.url);
  if (REDIRECT_HOSTS.has(url.hostname)) {
    url.hostname = CANONICAL_HOST;
    url.protocol = 'https:';
    url.port = '';
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }
  return context.next();
}
