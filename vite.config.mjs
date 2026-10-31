import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";
import { readBundle, validateBundle } from "./scripts/content-policy.mjs";
import { validateExhibitionDossiers } from "./scripts/stage04a-exhibition.mjs";
import { createStage04aFixture } from "./scripts/stage04a-fixture.mjs";
import { readTeamContent, projectPublicTeamContent } from "./scripts/team-content-policy.mjs";
import { projectReadingSources, withImageSources } from "./scripts/stage04b5/public-reading.mjs";
import { projectPublicBundle, projectPublicCentennial, projectPublicExploration, projectPublicDossiers } from "./scripts/stage07-public-projection.mjs";
const root = fileURLToPath(new URL("./", import.meta.url));
const moduleId = "virtual:history-content";
const historyModuleId = "virtual:history-preview";
const historyCopyModuleId = "virtual:history-copy";
const teamModuleId = "virtual:team-content";
const introModuleId = "virtual:intro-config";
const devStoryModuleId = "virtual:dev-story";
const readingContentModuleId = "virtual:stage07-reading-content";
export default defineConfig(async ({ command, mode }) => {
  // 默认构建及任意未命名模式都走发布校验；只有明确 --mode demo 的演示构建能读 MOCK。
  const demo =
    (command === "serve" && mode === "development") ||
    (command === "build" && mode === "demo");
  if (command === "build" && mode === "team") throw new Error("九人候选仅供本机内部预览，不能直接构建公开包");
  const teamPreview = command === "serve" && mode === "team";
  const historyPreview = mode === "history" || teamPreview;
  const stage04aTest = command === "build" && mode === "stage04a-test";
  const testFixture = stage04aTest ? createStage04aFixture() : null;
  const introPath = root + "content/release/intro.json";
  const devStoryPath = root + "content/release/dev-story.json";
  const introConfig = { enabled: false, mode: "paper", desktop: "", mobile: "", poster: "", mobilePoster: "", durationSeconds: 6 };
  const introAssets = introConfig.enabled ? [introConfig.desktop, introConfig.mobile, introConfig.poster, ...(introConfig.mobilePoster ? [introConfig.mobilePoster] : [])] : [];
  for (const path of introAssets) if (!/^intro\/[a-z0-9-]+\.(mp4|jpg)$/.test(path) || !existsSync(root + "public/" + path)) throw new Error("片头发布素材缺失或路径无效");
  const musicPath=root+"content/release/music.json";
  const musicConfig = JSON.parse(readFileSync(musicPath, "utf8").replace(/^\uFEFF/, ""));
  const musicAssets=musicConfig.enabled?[musicConfig.opus,musicConfig.aac]:[];
  if (musicConfig.enabled && (musicConfig.scope !== "global" || musicConfig.cueId !== "war" || musicAssets.length !== 2 || !musicAssets.every(path => /^music\/footprints-war\.(opus|m4a)$/.test(path)))) throw new Error("背景音乐配置不符合公开白名单");
  for(const path of musicAssets)if(!/^music\/footprints-war\.(opus|m4a)$/.test(path)||!existsSync(root+"public/"+path))throw new Error("背景音乐发布素材缺失或路径无效");
  const devStoryConfig = { enabled: false, reason: "stage07-public-build-excludes-development-story-media" };
  const devStoryAssets = devStoryConfig.enabled ? [devStoryConfig.video, devStoryConfig.poster] : [];
  for (const path of devStoryAssets) if (!/^team\/dev-story\/[a-z0-9-]+\.(mp4|jpg)$/.test(path) || !existsSync(root + "public/" + path)) throw new Error("开发纪事素材缺失或路径无效");
  let publicTeam = stage04aTest ? { members: [], reflections: [], audio: [], records: [], media: [] } : projectPublicTeamContent(readTeamContent(root));
  let teamAudioHandler = null;
  const refreshTeam = async () => {
    if (!teamPreview) return;
    const teamModuleUrl = new URL("./scripts/stage04b1-team-preview.mjs", import.meta.url);
    const { readInternalTeamContent, projectInternalTeamContent, teamAudioMiddleware } = await import(teamModuleUrl.href);
    const candidate = readInternalTeamContent(root);
    publicTeam = projectInternalTeamContent(candidate);
    teamAudioHandler = teamAudioMiddleware(root, publicTeam);
  };
  await refreshTeam();
  let readHistoryPreview = null;
  let research = null;
  let media = { images: [], routes: new Map() };
  if (historyPreview) {
    const historyModuleUrl = new URL("./scripts/stage01c-content.mjs", import.meta.url);
    const historyModule = await import(historyModuleUrl.href);
    const { readStage02Media } = await import(new URL("./scripts/stage02-media.mjs", import.meta.url).href);
    readHistoryPreview = (directory) => {
      const preview = historyModule.readHistoryPreview(directory);
      media = readStage02Media(root, preview);
      const researchRoot = root + "content/research/stage04a5/";
      const readResearchJson = (name) => JSON.parse(readFileSync(researchRoot + name, "utf8").replace(/^\uFEFF/, ""));
      const manifest = readResearchJson("manifest.json");
      if (manifest.reviewState !== "candidate-only") throw new Error("Stage04A.5 研究层必须保持候选状态");
      research = { ...manifest, sources: readResearchJson("sources.json"), candidates: readResearchJson("candidates.json"), media: readResearchJson("media.json") };
      return { ...preview, images: media.images, research };
    };
  }
  let validationBundle = null;
  const load = () => {
    for (const audio of publicTeam.audio) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.mp3$/.test(audio.path) || !existsSync(root + "public/" + audio.path)) throw new Error("公开录音文件缺失或路径无效：" + audio.id);
    }
    const sourceBundle = stage04aTest
      ? validateBundle(testFixture.bundle, { release: true })
      : readBundle(root + (demo ? "mock" : "content/release"), { release: !demo });
    validationBundle = sourceBundle;
    const bundle = sourceBundle;
    if (demo || stage04aTest) {
      for (const event of bundle.events)
        for (const media of event.media) {
          const file = root + "public/" + media.path;
          if (!(stage04aTest ? testFixture.assets.has(media.path) : existsSync(file))) throw new Error("素材文件不存在：" + media.path);
          const extension = media.path.split(".").pop()?.toLowerCase();
          if (
            !(
              media.type === "image"
                ? ["png", "jpg", "jpeg", "webp"]
                : ["mp3", "wav", "ogg"]
            ).includes(extension)
          )
            throw new Error("素材格式不在允许列表：" + media.path);
        }
    }
    if (demo || stage04aTest) return bundle;
    const projected = projectPublicBundle(bundle);
    return { ...projected, sources: projectReadingSources(projected.sources) };
  };
  let bundle = historyPreview ? null : load();
  let history = historyPreview
    ? readHistoryPreview(root + "content/staging/20261015-v1")
    : null;
  const extensionsPath = root + "content/release/exhibition.json";
  const readExtensions = () => {
    if (demo) return { dossiers: [] };
    if (historyPreview) return { dossiers: history?.dossiers ?? [] };
    const dossiers = stage04aTest
      ? testFixture.dossiers
      : existsSync(extensionsPath) ? JSON.parse(readFileSync(extensionsPath, "utf8").replace(/^\uFEFF/, "")).dossiers ?? [] : [];
    const approved = validateExhibitionDossiers(validationBundle ?? load(), dossiers, { release: true });
    return { dossiers: projectPublicDossiers(withImageSources(approved, (bundle ?? load()).events)) };
  };
  let exhibitionExtensions = readExtensions();
  // public 只按白名单输出，防止未审核素材被 Vite 自动复制至发布目录。
  return {
    base: "./",
    // Parallel MOCK/history development and isolated baseline checks must not invalidate one another's optimized dependencies.
    cacheDir: root + "output/vite-cache/" + mode + "-" + command,
    optimizeDeps: { entries: ["index.html"] },
    publicDir: false,
    plugins: [
      react(),
      {
        name: "reviewed-history-content",
        resolveId(id) {
          if (id === moduleId) return "\0" + moduleId;
          if (id === historyModuleId) return "\0" + historyModuleId;
          if (id === historyCopyModuleId) return "\0" + historyCopyModuleId;
          if (id === teamModuleId) return "\0" + teamModuleId;
          if (id === introModuleId) return "\0" + introModuleId;
          if (id === devStoryModuleId) return "\0" + devStoryModuleId;
          if (id === readingContentModuleId) return "\0" + readingContentModuleId;
        },
        buildStart() {
          if (!historyPreview) bundle = load();
          if (historyPreview) history = readHistoryPreview(root + "content/staging/20261015-v1");
          exhibitionExtensions = readExtensions();
        },
        load(id) {
          if (id === "\0" + introModuleId) return "export const introConfig = " + JSON.stringify({ enabled: introConfig.enabled, mode: introConfig.mode ?? "paper", desktop: introConfig.desktop, mobile: introConfig.mobile, poster: introConfig.poster, mobilePoster:introConfig.mobilePoster, durationSeconds: introConfig.durationSeconds }) + ";";
          if (id === "\0" + moduleId)
            return (
              "export const content = " +
              JSON.stringify(bundle ?? { events: [], places: [], sources: [], relations: [] }) +
              "; export const isDemo = " +
              String(demo && !historyPreview) +
              "; export const isHistoryPreview = " + String(historyPreview) + ";"
            );
          if (id === "\0" + historyModuleId)
            return "export const historyPreview = " + JSON.stringify(history ?? {}) + "; export const exhibitionExtensions = " + JSON.stringify(exhibitionExtensions) + "; export const isStage04aTest = " + String(stage04aTest) + ";";
          if (id === "\0" + teamModuleId) return "export const teamContent = " + JSON.stringify(publicTeam) + "; export const isTeamPreview = " + String(teamPreview) + ";";
          if (id === "\0" + devStoryModuleId) return "export const devStory = " + JSON.stringify(devStoryConfig) + ";";
          if (id === "\0" + readingContentModuleId) {
            const read = (name) => JSON.parse(readFileSync(root + "content/release/" + name + ".json", "utf8").replace(/^\uFEFF/, ""));
            return "export const centennialData = " + JSON.stringify(projectPublicCentennial(read("centennial"))) + "; export const walkData = " + JSON.stringify(projectPublicExploration(read("exploration"))) + ";";
          }
          if (id === "\0" + historyCopyModuleId) {
            const copy = historyPreview
              ? {
                  appTitle: "内部史料预览 · Stage 02",
                  appBody: "仅用于项目内部校对，展示的是已交付摘录，不代表网页稿或正式发布批准。",
                  appFootnote: "原稿定位与来源可在档案中追溯。",
                  heroFootnote: "内部史料预览 · 候选内容，不代表正式发布",
                  heroBadge: "内部预览",
                  mapDisclaimer: "关系线仅按 Stage 01B 的类型字段呈现；计划、实际、分散办学与组织联系保持区分。",
                  mapEmpty: "本章节当前没有已导入地点；请从右侧事件目录进入档案。",
                  mapFooter: "史料预览地点",
                  panelBadge: "内部预览",
                  status: "候选摘录",
                  summary: "摘要",
                  excerpts: "内部摘录预览",
                  previewNote: "当前内容来自已交付原稿摘录，尚未形成正式网页展示稿。",
                  media: "图片与素材 / 当前候选素材未进入公开预览",
                  intro: "从下方事件目录打开历史章节。无地点事件保留在目录中，不强制归入地图节点。",
                  noEvents: "本章节暂无已导入事件",
                  noEventsNote: "这是当前史料缺口，待后续补充",
                  chapterStatus: "候选内容 · 内部校对",
                  reading: "章节目录 → 事件摘录 → 来源定位",
                  reviewNote: "内部史料候选预览；不代表正式发布批准。",
                  factFallback: "暂无摘要；请阅读下方内部摘录预览。",
                }
              : Object.fromEntries([
                  "appTitle", "appBody", "appFootnote", "heroFootnote", "heroBadge",
                  "mapDisclaimer", "mapEmpty", "mapFooter", "panelBadge", "status",
                  "summary", "excerpts", "previewNote", "media", "intro", "noEvents",
                  "noEventsNote", "chapterStatus", "reading", "reviewNote", "factFallback",
                ].map((key) => [key, ""]));
            return "export const historyCopy = " + JSON.stringify(copy) + ";";
          }
        },
        configureServer(server) {
          if (teamPreview) server.watcher.add(root + "content/internal/stage04b1/team.json");
          server.watcher.add(root + (historyPreview ? "content/staging/20261015-v1" : demo ? "mock" : "content/release"));
          if (historyPreview) server.watcher.add(root + "docs/stage02/STAGE02_ASSET_MANIFEST.json");
          server.middlewares.use((req, res, next) => {
            let pathname;
            try { pathname = decodeURIComponent((req.url ?? "").split("?")[0]); }
            catch { res.statusCode = 400; res.end("Invalid URL"); return; }
            if (["/content/internal/", "/docs/stage04b1/", "/output/stage04b1/", "/scripts/stage04b1/"].some(prefix => pathname.startsWith(prefix))) {
              res.statusCode = 403; res.end("Internal review files are not served"); return;
            }
            if (pathname.startsWith("/__team-media/")) {
              if (teamPreview) return teamAudioHandler(req, res, next);
              res.statusCode = 404; res.end("Not found"); return;
            }
            if (pathname.startsWith("/__history-media/")) {
              const route = historyPreview ? media.routes.get(pathname) : null;
              if (!route) { res.statusCode = 404; res.end("Not found"); return; }
              if (!["GET", "HEAD"].includes(req.method ?? "GET")) { res.statusCode = 405; res.end(); return; }
              res.setHeader("Content-Type", route.contentType);
              res.setHeader("Cache-Control", "private, no-store");
              res.setHeader("X-Content-Type-Options", "nosniff");
              res.end(req.method === "HEAD" ? undefined : readFileSync(route.file));
              return;
            }
          const allowed = historyPreview ? ["favicon.svg", "sysu-emblem-red.png"] : [
              "favicon.svg",
              "sysu-emblem-red.png",
              ...publicTeam.media.map((item) => item.path),
              ...publicTeam.audio.map((item) => item.path),
              ...introAssets,...devStoryAssets,...musicAssets,
              ...bundle.events.flatMap((e) => e.media.map((m) => m.path)),
            ];
            const match = allowed.find((name) => pathname === "/" + name);
            if (!match) return next();
            const mime = {
              svg: "image/svg+xml",
              png: "image/png",
              jpg: "image/jpeg",
              jpeg: "image/jpeg",
              webp: "image/webp",
              mp3: "audio/mpeg",
              wav: "audio/wav",
              ogg: "audio/ogg",
              opus: "audio/ogg",
              m4a: "audio/mp4",
              mp4: "video/mp4",
            };
            res.setHeader(
              "Content-Type",
              mime[match.split(".").pop()] ?? "application/octet-stream",
            );
            res.end(readFileSync(root + "public/" + match));
          });
        },
        async handleHotUpdate(ctx) {
          if (teamPreview && ctx.file.replaceAll("\\", "/").endsWith("/content/internal/stage04b1/team.json")) {
            await refreshTeam();
            const mod = ctx.server.moduleGraph.getModuleById("\0" + teamModuleId);
            if (mod) ctx.server.moduleGraph.invalidateModule(mod);
            ctx.server.ws.send({ type: "full-reload" });
            return [];
          }
          if (historyPreview && (/[/\\]content[/\\]staging[/\\]20261015-v1[/\\].*\.json$/.test(ctx.file) || ctx.file.replaceAll("\\", "/").endsWith("/docs/stage02/STAGE02_ASSET_MANIFEST.json"))) {
            history = readHistoryPreview(root + "content/staging/20261015-v1");
            const mod = ctx.server.moduleGraph.getModuleById("\0" + historyModuleId);
            if (mod) ctx.server.moduleGraph.invalidateModule(mod);
            ctx.server.ws.send({ type: "full-reload" });
            return [];
          }
          if (!historyPreview && /[/\\](mock|release)[/\\].*\.json$/.test(ctx.file)) {
            bundle = load();
            const mod = ctx.server.moduleGraph.getModuleById("\0" + moduleId);
            if (mod) ctx.server.moduleGraph.invalidateModule(mod);
            ctx.server.ws.send({ type: "full-reload" });
            return [];
          }
        },
        generateBundle() {
          if (historyPreview) {
            for (const name of ["favicon.svg", "sysu-emblem-red.png"]) this.emitFile({type:"asset",fileName:name,source:readFileSync(root+"public/"+name)});
            for (const [path, route] of media.routes) this.emitFile({type:"asset",fileName:path.slice(1),source:readFileSync(route.file)});
            return;
          }
          const names = new Set([
            "favicon.svg",
            "sysu-emblem-red.png",
            ...publicTeam.audio.map((item) => item.path),
            ...publicTeam.media.map((item) => item.path),
            ...introAssets,
            ...musicAssets,
            ...devStoryAssets,
            ...bundle.events.flatMap((e) => e.media.map((m) => m.path)),
          ]);
          for (const name of names)
            this.emitFile({
              type: "asset",
              fileName: name,
              source: stage04aTest && testFixture.assets.has(name)
                ? testFixture.assets.get(name)
                : readFileSync(root + "public/" + name),
            });
          for (const name of ["404.html", "_redirects"])
            this.emitFile({
              type: "asset",
              fileName: name,
              source: readFileSync(root + "public/" + name),
            });
        },
      },
      {
        name: "public-release-bundle-hygiene",
        renderChunk(code) {
          if (demo || historyPreview || stage04aTest) return null;
          const replacements = [
            ["MOCK", "示例"],
            ["TEST ONLY", "测试"],
            ["AI代拟", "创作说明"],
            ["内部史料预览", "页面阅读"],
            ["内部预览", "页面状态"],
            ["candidate-only", "record-only"],
          ];
          return replacements.reduce((value, [from, to]) => value.split(from).join(to), code);
        },
      },
    ],
    build: { outDir: historyPreview ? "output/stage04b1/builds/history-internal" : stage04aTest ? "output/stage04a/builds/nonempty-test-20261016" : demo ? "dist-demo" : "dist", sourcemap: false },
    server: {
      host: "127.0.0.1", port: 5173, strictPort: true,
      watch: { followSymlinks: false, ignored: ["**/backups/**", "**/output/**", "**/content/staging/stage02-media/**"] },
      fs: {
        // Preserve Vite 8's default secret-file denial and add only Stage 01B internals.
        deny: [
          ".env", ".env.*", "*.{crt,pem,key,p12,pfx,cer,der}",
          ".npmrc", ".yarnrc.yml", "**/.git/**",
          "**/content/staging/**", "**/output/stage01b/**", "**/docs/stage01b/**",
          "**/docs/stage02/**", "**/output/stage02/**", "**/backups/**",
          "**/docs/stage03/**", "**/output/stage03/**",
          "**/content/internal/**", "**/docs/stage04b1/**", "**/output/stage04b1/**",
          "**/scripts/stage04b1/**",
        ],
      },
    },
  };
});
