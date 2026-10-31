import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
function option(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}
const target = path.resolve(option("--target", projectRoot));
const identityFileValue = option("--identity-file");
const identityFile = identityFileValue ? path.resolve(identityFileValue) : null;
const outputFileValue = option("--output");
const outputFile = outputFileValue ? path.resolve(outputFileValue) : null;
if (!existsSync(target) || !statSync(target).isDirectory()) throw new Error("扫描目标目录不存在");
if (identityFile && !existsSync(identityFile)) throw new Error("身份字典不可读");

const ignoredDirectories = new Set(["node_modules", ".git", "output", "backups", "dist", "dist-demo"]);
const ignoredFiles = new Set(["scripts/privacy-audit/scan-public.mjs"]);
const textExtensions = new Set([".css", ".html", ".json", ".js", ".mjs", ".ts", ".tsx", ".md", ".txt", ".yml", ".yaml", ".lock", ".svg", ".xml"]);
const patterns = [
  { id: "private-path", expression: /(?:[A-Za-z]:\\{1,2}(?:Users|Documents|Desktop|Downloads)\\{1,2}[A-Za-z0-9._-]+(?:\\{1,2}[^\s"']+)*)/gi },
  { id: "email", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { id: "phone", expression: /(?<![A-Za-z0-9-])(?:1[3-9]\d{9}|(?:\+?86[- ]?)?1[3-9][- ]?\d{4}[- ]?\d{4})(?![A-Za-z0-9-])/g },
  { id: "student-or-id-number", expression: /(?<![A-Za-z0-9])(?:学号|工号|身份证|病案号|QQ号|手机号)\s*[:：#]?\s*[A-Za-z0-9-]{4,}(?![A-Za-z0-9])/gi },
  { id: "secret-like", expression: /(?:sk-[A-Za-z0-9]{16,}|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]+ PRIVATE KEY-----)/g },
  { id: "old-production-site", expression: /sysu-footprints\.pages\.dev/gi },
  { id: "excluded-team-media-path", expression: /(?:^|["'])\/?(?:team\/audio|team\/collective|team\/dev-story)\/[^"'\s]+/g },
  { id: "legacy-member-query", expression: /[?&]member=[^&#"'\s]+/gi },
  { id: "excluded-history-media-path", expression: /(?:^|["'])\/?history\/stage04b3\/[^"'\s]+/g },
];

function listFiles(directory) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...listFiles(full));
    else result.push(full);
  }
  return result;
}

function identityValuesFrom(file) {
  if (!file) return [];
  const data = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  const rows = Array.isArray(data) ? data : [data];
  return [...new Set(rows.flatMap((row) => [row.sourceName, ...(Array.isArray(row.aliases) ? row.aliases : [])]).filter((value) => typeof value === "string" && value.trim().length >= 2))];
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

const identityValues = identityValuesFrom(identityFile);
const files = listFiles(target);
const findings = [];
const fileHashes = [];
for (const file of files) {
  const relative = path.relative(target, file).replaceAll("\\", "/");
  if (ignoredFiles.has(relative)) continue;
  const bytes = readFileSync(file);
  fileHashes.push({ path: relative, sha256: sha256(bytes) });
  const extension = path.extname(file).toLowerCase();
  const basename = path.basename(file);
  const textBuffers = textExtensions.has(extension) || basename.toLowerCase() === "readme"
    ? [bytes.toString("utf8")]
    : [bytes.toString("utf8"), bytes.toString("utf16le")];
  for (const content of textBuffers) {
    for (const pattern of patterns) {
      pattern.expression.lastIndex = 0;
      if (pattern.expression.test(content)) findings.push({ category: pattern.id, path: relative });
    }
    for (const value of identityValues) if (content.includes(value)) findings.push({ category: "identity-dictionary-match", path: relative });
  }
  for (const value of identityValues) if (basename.includes(value)) findings.push({ category: "identity-dictionary-match", path: relative });
}

const uniqueFindings = [...new Map(findings.map((finding) => [finding.category + ":" + finding.path, finding])).values()];
const categoryCounts = Object.fromEntries([...new Set(uniqueFindings.map((finding) => finding.category))].sort().map((category) => [category, uniqueFindings.filter((finding) => finding.category === category).length]));
const result = {
  schema: "stage07-public-privacy-scan-v1",
  target,
  identityDictionaryUsed: Boolean(identityFile),
  scannedFileCount: files.length,
  findingCount: uniqueFindings.length,
  categoryCounts,
  findings: uniqueFindings,
  fileHashes,
};
if (outputFile) {
  mkdirSync(path.dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, JSON.stringify(result, null, 2) + "\n", "utf8");
}
console.log(JSON.stringify({ ...result, findings: undefined, fileHashes: undefined, status: uniqueFindings.length ? "REVIEW_REQUIRED" : "PASS" }, null, 2));
if (uniqueFindings.length) process.exitCode = 2;
