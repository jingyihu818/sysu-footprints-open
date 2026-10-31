import { readFileSync } from "node:fs";
import { join } from "node:path";
const ids = ["a1","a2","a3","a4","a5","a6","a7","a8","a9"];
const directions = new Set(["planning", "early", "wartime", "movement"]);
const text = (value) => typeof value === "string" && value.trim().length > 0;
export function readTeamContent(root) {
  const value = JSON.parse(readFileSync(join(root, "content/release/team.json"), "utf8").replace(/^\uFEFF/, ""));
  if (!Array.isArray(value.members) || value.members.length !== 9 || value.members.some((member, index) => member.id !== ids[index])) throw new Error("team.json 必须保留 a1-a9 稳定成员映射");
  for (const member of value.members) {
    if (!/^创作者0[1-9]$/.test(member.displayName ?? "")) throw new Error(member.id + " 公开成员必须使用匿名创作者编号");
    if (!text(member.role) || !text(member.confirmedVersion) || member.displayPreference !== "public" || !directions.has(member.creativeDirection)) throw new Error(member.id + " 匿名成员岗位信息不完整");
  }
  if (value.audio?.length || value.media?.length || value.records?.length) throw new Error("公开团队数据不得包含录音、照片或过程记录");
  return value;
}
export function projectPublicTeamContent(team) {
  const reflections = (team.reflections ?? []).filter((item) => item.scope === "public");
  for (const item of reflections) if (item.status !== "approved" || item.confirmedByMember !== true) throw new Error(item.id + " 匿名公开手记缺少确认");
  return {
    members: team.members.map(({ id, displayName, role, department, creativeDirection }) => ({ id, displayName, role, department, creativeDirection })),
    reflections: reflections.map(({ id, memberId, displayText, excerpt, contribution }) => ({ id, memberId, displayText, excerpt: excerpt ?? null, contribution })),
    audio: [], records: [], media: [],
  };
}
