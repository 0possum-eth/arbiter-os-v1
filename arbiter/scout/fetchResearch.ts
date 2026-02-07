import type { ResearchSourceInput } from "./researchIngest";

type FetchResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<FetchResponse>;

export type FetchResearchOptions = {
  urls?: string[];
  allowedHosts?: string[];
  timeoutMs?: number;
  fetchImpl?: FetchLike;
};

const toList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const normalizeHost = (value: string) => value.trim().toLowerCase();

const normalizeWebSource = (url: string) => `web:${url}`;

const resolveUrls = (input?: string[]) => {
  if (Array.isArray(input)) {
    return input.map((item) => item.trim()).filter((item) => item.length > 0);
  }
  return toList(process.env.ARBITER_SCOUT_RESEARCH_URLS);
};

const resolveAllowedHosts = (input?: string[]) => {
  const values = Array.isArray(input) ? input : toList(process.env.ARBITER_SCOUT_RESEARCH_ALLOWLIST);
  return new Set(values.map((value) => normalizeHost(value)).filter((value) => value.length > 0));
};

const isAllowedUrl = (value: string, allowedHosts: Set<string>) => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  if (allowedHosts.size === 0) {
    return true;
  }

  return allowedHosts.has(normalizeHost(parsed.hostname));
};

const resolveTimeout = (input?: number) => {
  if (typeof input === "number" && Number.isFinite(input) && input > 0) {
    return Math.floor(input);
  }
  const fromEnv = Number.parseInt(process.env.ARBITER_SCOUT_RESEARCH_TIMEOUT_MS ?? "", 10);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }
  return 5_000;
};

const getFetchImpl = (fetchImpl?: FetchLike): FetchLike => {
  if (fetchImpl) {
    return fetchImpl;
  }
  const nativeFetch = globalThis.fetch;
  if (typeof nativeFetch !== "function") {
    throw new Error("fetch unavailable for scout research retrieval");
  }
  return (url, init) => nativeFetch(url, init) as Promise<FetchResponse>;
};

export async function fetchResearch(options: FetchResearchOptions = {}): Promise<ResearchSourceInput[]> {
  const urls = resolveUrls(options.urls);
  if (urls.length === 0) {
    return [];
  }

  const allowedHosts = resolveAllowedHosts(options.allowedHosts);
  const timeoutMs = resolveTimeout(options.timeoutMs);
  const fetchImpl = getFetchImpl(options.fetchImpl);
  const records: ResearchSourceInput[] = [];

  for (const url of urls) {
    if (!isAllowedUrl(url, allowedHosts)) {
      continue;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { signal: controller.signal });
      if (!response.ok) {
        continue;
      }
      const content = (await response.text()).trim();
      if (content.length === 0) {
        continue;
      }
      records.push({
        source: normalizeWebSource(url),
        content
      });
    } catch {
      continue;
    } finally {
      clearTimeout(timeout);
    }
  }

  return records;
}
