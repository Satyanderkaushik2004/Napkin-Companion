// Static checks for the packaged extension. Run: node scripts/check.mjs
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("extension");
let failed = 0;
const ok = (c, msg) => { console.log(`${c ? "PASS" : "FAIL"}  ${msg}`); if (!c) failed++; };

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
ok(manifest.manifest_version === 3, "manifest_version is 3");
ok(/^\d+(\.\d+){0,3}$/.test(manifest.version), "version format is valid");
ok(!/beta|internal/i.test(manifest.name + manifest.description), "no beta/internal wording in name or description");
const paths = [
  manifest.action?.default_popup, manifest.side_panel?.default_path, manifest.options_page,
  manifest.background?.service_worker, ...(manifest.content_scripts ?? []).flatMap(c => c.js),
  ...Object.values(manifest.icons ?? {}),
];
for (const p of paths) ok(fs.existsSync(path.join(root, p)), `manifest path exists: ${p}`);
ok(manifest.commands?.["generate-with-napkin"]?.suggested_key?.default === "Ctrl+Shift+N", "shortcut Ctrl+Shift+N declared");

// every relative/absolute asset referenced from JS and HTML must exist
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(root);
for (const f of files.filter(f => /\.(js|html)$/.test(f))) {
  const text = fs.readFileSync(f, "utf8");
  for (const m of text.matchAll(/["'](\.{1,2}\/[^"']*assets\/[^"']+\.(?:js|css))["']|(?:src|href)="(\/assets\/[^"]+)"/g)) {
    const ref = m[1] ?? m[2];
    const target = ref.startsWith("/") ? path.join(root, ref) : path.resolve(path.dirname(f), ref);
    ok(fs.existsSync(target), `${path.relative(root, f)} -> ${ref}`);
  }
}
// hosts
const text = files.filter(f => f.endsWith(".js")).map(f => fs.readFileSync(f, "utf8")).join("\n");
const hosts = new Set([...text.matchAll(/https?:\/\/([a-z0-9.-]+)/g)].map(m => m[1]));
const allowed = new Set(["api.napkin.ai", "app.napkin.ai", "reactjs.org", "www.w3.org"]);
ok([...hosts].every(h => allowed.has(h)), `only expected hosts referenced: ${[...hosts].join(", ")}`);
process.exit(failed ? 1 : 0);
