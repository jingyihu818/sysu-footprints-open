export type TeamStatus = "draft" | "pending" | "approved" | "rejected";
export type TeamScope = "internal" | "public";
export type CreativeDirection = "planning" | "early" | "wartime" | "movement";
export interface TeamMember { id: string; displayName: string | null; role: string | null; department: string | null; displayPreference: "unconfirmed" | "public" | "withhold"; confirmedVersion: string | null; creativeDirection?: CreativeDirection }
export interface TeamReflection { id: string; memberId: string; originalVersion: string; displayText: string; excerpt: string | null; contribution: string; status: TeamStatus; scope: TeamScope; confirmedByMember: boolean }
export interface TeamAudio { id: string; memberId: string; path: string; durationSeconds: number; transcript: string | null; transcriptStatus?: "author-verified" | "candidate" | null; title: string | null; scope: TeamScope; speakerConfirmed: boolean; rightsStatus: "pending" | "approved" }
export interface TeamRecord { id: string; title: string; dateLabel: string | null; datePrecision: "day" | "month" | "year" | "unknown"; participantIds: string[]; description: string; relatedMediaIds: string[]; status: TeamStatus; scope: TeamScope }
export interface TeamMedia { id: string; type: "image"; path: string; relatedMemberIds: string[]; relatedRecordIds: string[]; caption: string; alt: string; source: string; photographer: string | null; rightsStatus: "pending" | "approved"; identifiablePeopleConsent: "pending" | "approved" | "not-applicable"; scope: TeamScope }
export interface TeamContent { members: TeamMember[]; reflections: TeamReflection[]; audio: TeamAudio[]; records: TeamRecord[]; media: TeamMedia[] }
const ids = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9"];
function requireText(value: unknown, label: string): asserts value is string { if (typeof value !== "string" || !value.trim()) throw new Error(label + " 不能为空"); }
export function emptyTeamContent(): TeamContent {
  return { members: ids.map((id, i) => ({ id, displayName: "创作者" + String(i + 1).padStart(2, "0"), role: "匿名共创岗位", department: null, displayPreference: "public", confirmedVersion: "stage07-anonymized-public-v1" })), reflections: [], audio: [], records: [], media: [] };
}
export function validateTeamContent(value: unknown): asserts value is TeamContent {
  if (!value || typeof value !== "object") throw new Error("Team content must be an object");
  const team = value as TeamContent;
  for (const key of ["members", "reflections", "audio", "records", "media"] as const) if (!Array.isArray(team[key])) throw new Error("Team " + key + " must be an array");
  if (team.members.length !== ids.length || team.members.some((member, i) => member.id !== ids[i])) throw new Error("成员槽位必须按稳定映射 a1–a9 完整提供");
  const memberIds = new Set(ids); const checkMember = (id: string) => { if (!memberIds.has(id)) throw new Error("未知成员 ID：" + id); };
  for (const member of team.members) {
    if (!/^创作者0[1-9]$/.test(member.displayName ?? "")) throw new Error(member.id + " 公开显示名必须使用匿名创作者编号");
    if (!member.role || !member.confirmedVersion) throw new Error(member.id + " 公开匿名岗位缺少分工或版本");
    if (member.displayPreference !== "public") throw new Error(member.id + " 必须以匿名公开岗位展示");
    if (member.creativeDirection !== undefined && !["planning", "early", "wartime", "movement"].includes(member.creativeDirection)) throw new Error(member.id + " 创作方向无效");
  }
  for (const item of team.reflections) { checkMember(item.memberId); requireText(item.displayText, item.id + " 展示文字"); requireText(item.contribution, item.id + " 实际贡献"); requireText(item.originalVersion, item.id + " 原稿版本"); if (item.status !== "approved" || item.scope !== "public" || item.confirmedByMember !== true) throw new Error(item.id + " 匿名公开手记必须采用已确认公开版本"); }
  if (team.audio.length !== 0) throw new Error("公开版禁止成员录音");
  if (team.media.length !== 0) throw new Error("公开版禁止成员照片或其他团队影像");
  if (team.records.length !== 0) throw new Error("公开版不收录可关联成员的过程记录");
}
export function projectPublicTeamContent(team: TeamContent): PublicTeamContent {
  validateTeamContent(team);
  return {
    members: team.members.map(({ id, displayName, role, department, creativeDirection }) => ({ id, displayName, role, department, creativeDirection })),
    reflections: team.reflections.map(({ id, memberId, displayText, excerpt, contribution }) => ({ id, memberId, displayText, excerpt, contribution })),
    audio: [], records: [], media: [],
  };
}
export interface PublicTeamReflection { id: string; memberId: string; displayText: string; excerpt: string | null; contribution: string; learningText?: string | null; previousPractice?: string | null; draftKind?: string; displayNotice?: string | null }
export interface PublicTeamAudio { id: string; memberId: string; path: string; durationSeconds: number; transcript: string | null; title: string | null; transcriptStatus?: string | null }
export interface PublicTeamRecord { id: string; title: string; dateLabel: string | null; datePrecision: TeamRecord["datePrecision"]; participantIds: string[]; description: string; relatedMediaIds: string[] }
export interface PublicTeamMedia { id: string; type: "image"; path: string; relatedMemberIds: string[]; relatedRecordIds: string[]; caption: string; alt: string; source: string; photographer: string | null }
export interface PublicTeamMember { id: string; displayName: string | null; role: string | null; department: string | null; creativeDirection?: CreativeDirection }
export interface PublicTeamContent { members: PublicTeamMember[]; reflections: PublicTeamReflection[]; audio: PublicTeamAudio[]; records: PublicTeamRecord[]; media: PublicTeamMedia[] }
