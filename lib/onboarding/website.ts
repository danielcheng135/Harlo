export type LogoDiscoveryResult = {
  normalizedUrl: string;
  origin: string;
  hostname: string;
  logoUrl: string | null;
  error: string | null;
};

export type WebsiteIdentity = Pick<LogoDiscoveryResult, "normalizedUrl" | "origin" | "hostname">;

type LogoCandidate = {
  href: string;
  weight: number;
};

const IMAGE_EXTENSIONS = /\.(avif|gif|ico|jpe?g|png|svg|webp)(\?.*)?$/i;

export function normalizeWebsiteUrl(input: string) {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  url.hash = "";

  return url.toString();
}

export function getWebsiteIdentity(input: string): WebsiteIdentity {
  const normalizedUrl = normalizeWebsiteUrl(input);
  const parsed = new URL(normalizedUrl);

  return {
    normalizedUrl,
    origin: parsed.origin,
    hostname: parsed.hostname
  };
}

export function getFallbackLogoUrl(input: string) {
  const { hostname } = getWebsiteIdentity(input);

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
}

export async function discoverWebsiteLogo(input: string): Promise<LogoDiscoveryResult> {
  const { normalizedUrl, origin, hostname } = getWebsiteIdentity(input);

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "HarloBot/1.0 (+https://harloai.co)"
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      throw new Error(`Website returned ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("Website did not return HTML.");
    }

    const html = await response.text();
    const logoUrl = await findBestLogoUrl(html, normalizedUrl);

    return {
      normalizedUrl,
      origin,
      hostname,
      logoUrl,
      error: logoUrl ? null : "No usable logo found."
    };
  } catch (error) {
    return {
      normalizedUrl,
      origin,
      hostname,
      logoUrl: null,
      error: error instanceof Error ? error.message : "Could not discover website logo."
    };
  }
}

async function findBestLogoUrl(html: string, baseUrl: string) {
  const candidates = extractLogoCandidates(html, baseUrl);

  for (const candidate of candidates.sort((a, b) => b.weight - a.weight)) {
    if (await isUsableImageUrl(candidate.href)) {
      return candidate.href;
    }
  }

  return null;
}

function extractLogoCandidates(html: string, baseUrl: string) {
  const candidates: LogoCandidate[] = [];

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const rel = getAttribute(tag, "rel")?.toLowerCase() ?? "";
    const href = getAttribute(tag, "href");

    if (!href) {
      continue;
    }

    if (rel.includes("apple-touch-icon")) {
      candidates.push({ href: resolveUrl(href, baseUrl), weight: 40 });
    } else if (rel.includes("mask-icon")) {
      candidates.push({ href: resolveUrl(href, baseUrl), weight: 35 });
    } else if (rel.includes("icon")) {
      candidates.push({ href: resolveUrl(href, baseUrl), weight: 30 });
    }
  }

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const property = (getAttribute(tag, "property") ?? getAttribute(tag, "name") ?? "").toLowerCase();
    const content = getAttribute(tag, "content");

    if (!content) {
      continue;
    }

    if (property === "og:logo") {
      candidates.push({ href: resolveUrl(content, baseUrl), weight: 28 });
    } else if (property === "og:image" || property === "twitter:image") {
      candidates.push({ href: resolveUrl(content, baseUrl), weight: 15 });
    }
  }

  const origin = new URL(baseUrl).origin;
  const hostname = new URL(baseUrl).hostname;
  candidates.push({ href: `${origin}/apple-touch-icon.png`, weight: 12 });
  candidates.push({ href: `${origin}/favicon.ico`, weight: 10 });
  candidates.push({ href: getFallbackLogoUrl(hostname), weight: 5 });

  return dedupeCandidates(candidates);
}

function getAttribute(tag: string, attribute: string) {
  const pattern = new RegExp(`${attribute}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);
  return match?.[2] ?? match?.[3] ?? match?.[4] ?? null;
}

function resolveUrl(value: string, baseUrl: string) {
  return new URL(value.trim(), baseUrl).toString();
}

function dedupeCandidates(candidates: LogoCandidate[]) {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    if (seen.has(candidate.href)) {
      return false;
    }

    seen.add(candidate.href);
    return true;
  });
}

async function isUsableImageUrl(url: string) {
  if (IMAGE_EXTENSIONS.test(url)) {
    return true;
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        accept: "image/*",
        "user-agent": "HarloBot/1.0 (+https://harloai.co)"
      },
      signal: AbortSignal.timeout(3500)
    });

    const contentType = response.headers.get("content-type") ?? "";
    return response.ok && contentType.startsWith("image/");
  } catch {
    return false;
  }
}
