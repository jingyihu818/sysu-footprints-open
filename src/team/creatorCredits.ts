export type CreatorGroupId = "planning-production" | "research" | "content-visual";
type CreatorCredit = { title: string; groupId: CreatorGroupId };

// Work-specific credits, keyed by the unchanged Release member identity.
// Original contribution text and historical research directions stay in Release.
const credits: Record<string, CreatorCredit> = {
  a1: { title: "策划总监", groupId: "planning-production" },
  a2: { title: "技术总监", groupId: "planning-production" },
  a3: { title: "历史文案编辑", groupId: "content-visual" },
  a4: { title: "历史影像编研", groupId: "content-visual" },
  a5: { title: "创校史料策展", groupId: "research" },
  a6: { title: "抗战文献编研", groupId: "research" },
  a7: { title: "党史资料编研", groupId: "research" },
  a8: { title: "迁校史料编研", groupId: "research" },
  a9: { title: "视觉史料策展", groupId: "content-visual" },
};

export function creatorCredit(memberId: string): CreatorCredit | undefined {
  return credits[memberId];
}

export const creatorGroups: { id: CreatorGroupId; title: string; note: string; label: string; mark: string }[] = [
  { id: "planning-production", title: "策划与技术", note: "作品策划、内容统筹与交互制作", label: "策划与技术", mark: "构想" },
  { id: "research", title: "历史研究", note: "史料检索、文献编研与脉络梳理", label: "历史研究", mark: "考据" },
  { id: "content-visual", title: "内容与视觉", note: "历史文字编辑与影像资料整理", label: "内容与视觉", mark: "表达" },
];
