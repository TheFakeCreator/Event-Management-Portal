// Utility to build URLs consistently across frontend and backend
export type BuildUrlOptions = {
  base?: string; // e.g. https://example.com or http://localhost:3000
  version?: string | null; // e.g. 'v1' or null to skip version segment
  path?: string; // e.g. '/auth/verify' or 'auth/verify'
  query?: Record<string, string | number | boolean | undefined | null>;
};

function trimSlashes(input = ''): string {
  return input.replace(/^\/+|\/+$/g, '');
}

export function buildUrl(options: BuildUrlOptions): string {
  const { base = '', version = null, path = '', query } = options;

  const trimmedBase = base.replace(/\/+$/g, ''); // remove trailing slashes

  const parts: string[] = [];

  if (trimmedBase) parts.push(trimmedBase);

  if (version) parts.push(trimSlashes(String(version)));

  if (path) parts.push(trimSlashes(path));

  const pathname = parts.join('/');

  let url = pathname || '/';

  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      searchParams.append(k, String(v));
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  return url;
}

export default buildUrl;
