// Behavioral tests for the download-host guard and background message validation (mocked chrome/fetch).
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

const calls = [];
globalThis.document = { createElement: () => ({ relList: { supports: () => true } }), querySelectorAll: () => [] };
globalThis.MutationObserver = class { observe() {} };
globalThis.chrome = { storage: { local: { get: async () => ({ napkin_api_token: "TEST-TOKEN" }), set: async () => {}, remove: async () => {} } } };
globalThis.fetch = async (url, init) => { calls.push({ url, headers: init?.headers ?? {} }); return { ok: true, blob: async () => "blob" }; };

const mod = await import(pathToFileURL(path.resolve("extension/assets/globals-DIJNU1uY.js")));
const provider = new mod.N();

await provider.client.downloadFile("https://api.napkin.ai/v1/files/1");
assert.equal(calls.at(-1).headers.Authorization, "Bearer TEST-TOKEN");

await provider.client.downloadFile("https://cdn.example.com/signed/file.svg");
assert.equal(calls.at(-1).headers.Authorization, undefined, "token must not go to other hosts");

await assert.rejects(provider.client.downloadFile("http://api.napkin.ai/x"), /invalid URL/);
await assert.rejects(provider.client.downloadFile("not a url"), /invalid URL/);
console.log("PASS  download guard: token only sent to https://api.napkin.ai");

// background validation
const opened = [];
let onMessage;
globalThis.chrome = {
  runtime: { id: "self", onInstalled: { addListener() {} }, onMessage: { addListener: f => (onMessage = f) }, sendMessage: () => Promise.resolve() },
  contextMenus: { create() {}, onClicked: { addListener() {} } },
  commands: { onCommand: { addListener() {} } },
  sidePanel: { open: async a => opened.push(a) },
  storage: { session: { set: async v => opened.push(v) } },
};
await import(pathToFileURL(path.resolve("extension/src/background/index.js")));
const tab = { id: 7 };
const good = { type: "OPEN_SIDE_PANEL_WITH_SELECTION", text: "hello", sourceUrl: "https://example.com" };
onMessage(good, { id: "other", tab }); onMessage(good, { id: "self" });
onMessage({ ...good, text: 5 }, { id: "self", tab }); onMessage({ ...good, text: "  " }, { id: "self", tab });
onMessage({ type: "X" }, { id: "self", tab });
assert.equal(opened.length, 0, "invalid messages must be ignored");
onMessage({ ...good, sourceUrl: "javascript:alert(1)" }, { id: "self", tab });
await new Promise(r => setTimeout(r, 10));
const stored = opened.find(o => o.napkin_pending_action)?.napkin_pending_action;
assert.equal(stored.sourceUrl, "", "non-http(s) sourceUrl dropped");
assert.equal(stored.text, "hello");
console.log("PASS  background: rejects foreign sender / bad payload, sanitizes sourceUrl");
