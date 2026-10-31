const text = (value) => typeof value === "string" && value.trim().length > 0;
export function validateExhibitionDossiers(bundle, dossiers, { release = false } = {}) {
  if (!Array.isArray(dossiers)) throw new Error("exhibition dossiers 必须为数组");
  const events = new Map(bundle.events.map((item) => [item.id, item]));
  const sources = new Map(bundle.sources.map((item) => [item.id, item]));
  const places = new Map(bundle.places.map((item) => [item.id, item]));
  const ids = new Set();
  for (const dossier of dossiers) {
    if (!text(dossier.id) || ids.has(dossier.id)) throw new Error("卷宗 ID 缺失或重复");
    ids.add(dossier.id);
    if (dossier.periodId !== "p1947" || !text(dossier.title) || !Array.isArray(dossier.pages) || dossier.pages.length !== 6) throw new Error(dossier.id + " 必须包含1947六页卷宗结构");
    if (release && dossier.status !== "adopted" && (dossier.status !== "approved" || !text(dossier.reviewedBy) || !/^\d{4}-\d{2}-\d{2}$/.test(dossier.reviewedAt ?? "") || !text(dossier.reviewNote))) throw new Error(dossier.id + " 缺少卷宗审核状态或审核记录");
    const pageIds = new Set(dossier.pages.map((page) => page.id));
    if (pageIds.size !== 6 || dossier.pages.some((page, i) => !text(page.id) || page.order !== i + 1 || !text(page.title) || !Array.isArray(page.eventIds) || !Array.isArray(page.sourceIds) || !Array.isArray(page.placeIds))) throw new Error(dossier.id + " 六页目录结构无效");
    for (const [index, page] of dossier.pages.entries()) {
      if (release && !["approved", "adopted-by-project-policy"].includes(page.editorialStatus)) throw new Error(page.id + " 页面展示稿尚未审核通过或纳入采用范围");
      if (page.previousId !== (index ? dossier.pages[index - 1].id : null) || page.nextId !== (index < 5 ? dossier.pages[index + 1].id : null)) throw new Error(page.id + " 前后页索引不连续");
      for (const id of page.eventIds) { const event = events.get(id); if (!event) throw new Error(page.id + " 引用不存在的事件：" + id); if (event.periodId !== dossier.periodId) throw new Error(page.id + " 引用的事件章节不一致"); if (release && (!["approved", "adopted"].includes(event.status) || event.isMock)) throw new Error(page.id + " 引用未审核或未采用事件：" + id); }
      for (const id of page.sourceIds) { const source = sources.get(id); if (!source) throw new Error(page.id + " 引用不存在的来源：" + id); if (release && (!["approved", "adopted"].includes(source.status) || source.isMock)) throw new Error(page.id + " 引用未审核或未采用来源：" + id); }
      for (const id of page.placeIds) { const place = places.get(id); if (!place) throw new Error(page.id + " 引用不存在的地点：" + id); if (release && (!["approved", "adopted"].includes(place.status) || place.isMock)) throw new Error(page.id + " 引用未审核或未采用地点：" + id); }
    }
  }
  return dossiers;
}
