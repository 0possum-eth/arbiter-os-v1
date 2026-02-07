import assert from "node:assert/strict";
import { test } from "node:test";

import { fetchResearch } from "../fetchResearch";

test("fetchResearch returns empty when no urls are configured", async () => {
  const records = await fetchResearch({
    urls: [],
    fetchImpl: async () => {
      throw new Error("fetch should not run");
    }
  });

  assert.deepEqual(records, []);
});

test("fetchResearch fetches configured urls with deterministic source ids", async () => {
  const calls: string[] = [];
  const records = await fetchResearch({
    urls: ["https://example.com/research/alpha", "https://example.com/research/beta"],
    allowedHosts: ["example.com"],
    fetchImpl: async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        text: async () => `content for ${url}`
      };
    }
  });

  assert.deepEqual(calls, ["https://example.com/research/alpha", "https://example.com/research/beta"]);
  assert.deepEqual(records, [
    {
      source: "web:https://example.com/research/alpha",
      content: "content for https://example.com/research/alpha"
    },
    {
      source: "web:https://example.com/research/beta",
      content: "content for https://example.com/research/beta"
    }
  ]);
});

test("fetchResearch ignores urls outside allowlist", async () => {
  const calls: string[] = [];
  const records = await fetchResearch({
    urls: ["https://example.com/research/alpha", "https://blocked.example/research/gamma"],
    allowedHosts: ["example.com"],
    fetchImpl: async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        text: async () => `content for ${url}`
      };
    }
  });

  assert.deepEqual(calls, ["https://example.com/research/alpha"]);
  assert.deepEqual(records, [
    {
      source: "web:https://example.com/research/alpha",
      content: "content for https://example.com/research/alpha"
    }
  ]);
});
