import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { emptyTeamContent, validateTeamContent, projectPublicTeamContent } from "../src/team/content.ts";

test("九个稳定成员槽位不以工程占位姓名或个人经历填充", () => {
  const team = emptyTeamContent();
  assert.deepEqual(team.members.map((member) => member.id), ["a1","a2","a3","a4","a5","a6","a7","a8","a9"]);
  assert.equal(team.reflections.length, 0);
  assert.equal(team.audio.length, 0);
  assert.equal(team.records.length, 0);
  assert.equal(team.media.length, 0);
  assert.ok(team.members.slice(2).every((member) => member.displayName === null && member.role === null));
  assert.deepEqual(projectPublicTeamContent(team).members.map((member) => member.id), ["a1", "a2"]);
});

test("团队公开投影保留内容确认与展示范围门禁", () => {
  const team = emptyTeamContent();
  team.members[0] = { ...team.members[0], displayName: "TEST ONLY", role: "TEST ONLY", displayPreference: "public", confirmedVersion: "test-v1" };
  team.reflections.push({ id:"test-reflection", memberId:"a1", originalVersion:"test-v1", displayText:"TEST ONLY synthetic fixture", excerpt:null, contribution:"TEST ONLY", status:"approved", scope:"public", confirmedByMember:true });
  validateTeamContent(team);
  assert.equal(projectPublicTeamContent(team).reflections.length, 1);
  team.reflections[0].confirmedByMember = false;
  assert.throws(() => projectPublicTeamContent(team), /本人确认/);
});

test("音频与团队影像不能在缺少本人确认或权利记录时进入公开投影", () => {
  const team = emptyTeamContent();
  team.members[0] = { ...team.members[0], displayName: "TEST ONLY", role: "TEST ONLY", displayPreference: "public", confirmedVersion: "test-v1" };
  team.audio.push({ id:"test-audio", memberId:"a1", path:"team/test.mp3", durationSeconds:1, transcript:"TEST ONLY", scope:"public", speakerConfirmed:false, rightsStatus:"pending" });
  assert.throws(() => projectPublicTeamContent(team), /录音本人确认/);
});

test("正式投影只公开许可字段，不泄漏原件定位、哈希、内部状态或同意记录", () => {
  const team = emptyTeamContent();
  team.reflections.push({ id:"test-reflection", memberId:"a1", originalVersion:"test-v1", displayText:"TEST ONLY", excerpt:null, contribution:"TEST ONLY", status:"approved", scope:"public", confirmedByMember:true, originalFileName:"PRIVATE-original.docx", originalSha256:"private-hash" });
  team.audio.push({ id:"test-audio", memberId:"a1", path:"team/test.m4a", durationSeconds:1, transcript:"TEST ONLY", title:null, scope:"public", speakerConfirmed:true, rightsStatus:"approved", originalFileName:"PRIVATE-recording.m4a", originalSha256:"private-audio-hash" });
  team.records.push({ id:"test-record", title:"TEST ONLY record", dateLabel:"2026-10", datePrecision:"month", participantIds:["a1"], description:"TEST ONLY", relatedMediaIds:["test-media"], status:"approved", scope:"public", sourceReceipt:"C:/PRIVATE/chat-export" });
  team.media.push({ id:"test-media", type:"image", path:"team/test.webp", relatedMemberIds:["a1"], relatedRecordIds:["test-record"], caption:"TEST ONLY", alt:"TEST ONLY", source:"TEST ONLY public source label", photographer:null, rightsStatus:"approved", identifiablePeopleConsent:"approved", scope:"public", originalFileName:"PRIVATE-photo.jpg", originalSha256:"private-image-hash" });
  const publicData = projectPublicTeamContent(team);
  const serialized = JSON.stringify(publicData);
  for (const forbidden of ["PRIVATE-original.docx", "PRIVATE-recording.m4a", "PRIVATE-photo.jpg", "private-hash", "private-audio-hash", "private-image-hash", "sourceReceipt", "speakerConfirmed", "confirmedByMember", "rightsStatus"]) assert.equal(serialized.includes(forbidden), false, forbidden);
  assert.equal(publicData.audio[0].path, "team/test.m4a");
});

test("release team 内容文件保留九个稳定槽位且当前没有虚构经历", () => {
  const file = join(process.cwd(), "content/release/team.json");
  const team = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  validateTeamContent(team);
  assert.deepEqual(team.members.map((member) => member.id), ["a1","a2","a3","a4","a5","a6","a7","a8","a9"]);
  assert.equal(projectPublicTeamContent(team).reflections.length, 9);
});
