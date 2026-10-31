import type { Source } from "../types/content";

const TYPE_LABELS: Record<Source["sourceType"], string> = {
  book: "书籍", article: "文章", archive: "档案材料", "archive-index": "档案目录", "team-manuscript": "整理稿",
  "web-page": "网页资料", newspaper: "报刊资料", "official-web": "校史网页", "oral-history": "口述材料", placeholder: "资料条目",
};

export function sourceValue(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text || /^(?:未提供|来源记录未提供(?:作者或机构)?|作者\s*[/／]\s*机构未提供|未指定|暂无|尚未提供|无|占位字段)$/.test(text)) return null;
  return text;
}

export function sourceTitle(value: string | null | undefined): string {
  const title = sourceValue(value);
  if (!title) return "题名未详";
  return title.replace(/\s*[（(]来源记录[）)]/g, "").replace(/来源记录/g, "资料出处").trim();
}

export function sourceDisplayType(type: Source["sourceType"]): string { return TYPE_LABELS[type] ?? "史料"; }
export function sourceCreator(source: Source): string | null {
  const author = sourceValue(source.author);
  if (author) return author;
  const authors = source.authors?.map(sourceValue).filter(Boolean).join("、");
  if (authors) return authors;
  const creator = sourceValue(source.creator);
  return creator && creator !== sourceValue(source.publisher) ? creator : null;
}
export function sourcePublisher(source: Source): string | null { return sourceValue(source.publisher) ?? sourceValue(source.creator); }
export function sourceDate(source: Source): string | null { return sourceValue(source.publicationDate); }

export function formatSourceLocator(value: string | null | undefined): string | null {
  const text = sourceValue(value);
  if (!text) return null;
  const documentParagraphs = [...text.matchAll(/document\.xml#p(\d+)/gi)].map((match) => Number(match[1]));
  if (documentParagraphs.length) return "原文第" + documentParagraphs.join("、") + "段";
  const webParagraphs = /\bHTML\b/i.test(text) ? [...text.matchAll(/\bp(\d+)/gi)].map((match) => Number(match[1])) : [];
  if (webParagraphs.length) return "网页第" + webParagraphs.join("、") + "段";
  const page = text.match(/^page:(\d+)\/(.+)$/i);
  if (page) return "网页第" + page[1] + "页，" + page[2];
  if (/^document$/i.test(text)) return "原文位置未详";
  if (/纸本文献.*(?:下方)?定位/.test(text)) return "纸本文献对应位置";
  if (/具体引用期页未提供|原稿定位未提供|定位未提供/.test(text)) return "具体页码未详";
  return text;
}

export function sourceNote(source: Source): string | null {
  const note = sourceValue(source.reviewNote);
  if (!note) return null;
  return note.replace(/项目采用/g, "本页采用").replace(/纳入本展陈/g, "用于本页阅读");
}
