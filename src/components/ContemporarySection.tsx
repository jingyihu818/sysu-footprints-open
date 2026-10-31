import { useEffect, useRef, useState } from "react";
import { site } from "../config/site";
import { teamContent } from "virtual:team-content";
import type { MotionDirector } from "../motion/director";
import { Arrow } from "./Icon";
import AmbientMeteors from "./AmbientMeteors";
import "../team/contemporary.css";
import { creatorCredit, creatorGroups as directions } from "../team/creatorCredits";

const fromUrl = () => { const value = new URLSearchParams(location.search).get("creator"); return teamContent.members.some((item) => item.id === value) ? value : null; };
const paragraphs = (text: string) => text.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>);

export default function ContemporarySection({ active, reduced, director, onHistory, onHome }: { active: boolean; reduced: boolean; director: MotionDirector; onHistory: () => void; onHome: () => void }) {
  const [selected, setSelected] = useState<string | null>(fromUrl);
  const dossier = useRef<HTMLElement>(null);
  const directory = useRef<HTMLDivElement>(null);
  const hasOpened = useRef(false);
  const member = teamContent.members.find((item) => item.id === selected);
  const reflection = teamContent.reflections.find((item) => item.memberId === selected);
  useEffect(() => { if (!active) setSelected(null); }, [active]);
  useEffect(() => {
    const onPop = () => setSelected(fromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (selected) {
      hasOpened.current = true;
      dossier.current?.querySelector<HTMLElement>("h4")?.focus({ preventScroll: true });
      dossier.current?.scrollIntoView({ block: "start", behavior: "instant" });
      if (dossier.current && !reduced) director.play("team-sheet", [{ element: dossier.current, keyframes: [{ opacity: 0.6, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], options: { duration: 260, easing: "cubic-bezier(.2,.6,.2,1)" } }]);
    } else if (hasOpened.current) directory.current?.querySelector<HTMLElement>("[data-member]")?.focus({ preventScroll: true });
    return () => director.cancel("team-sheet");
  }, [selected, reduced, director]);
  function select(id: string | null) {
    setSelected(id);
    const url = new URL(location.href);
    url.searchParams.set("chapter", "p2026");
    if (id) url.searchParams.set("creator", id); else url.searchParams.delete("creator");
    url.searchParams.delete("member");
    url.hash = "contemporary";
    history.pushState({ creator: id }, "", url);
    if (!id) requestAnimationFrame(() => directory.current?.scrollIntoView({ block: "start", behavior: "instant" }));
  }
  function returnToDirectory() {
    const old = selected;
    select(null);
    requestAnimationFrame(() => directory.current?.querySelector<HTMLElement>('[data-member="' + old + '"]')?.focus({ preventScroll: true }));
  }
  function step(delta: number) {
    const index = teamContent.members.findIndex((item) => item.id === selected);
    select(teamContent.members[(index + delta + teamContent.members.length) % teamContent.members.length].id);
  }
  return <section className="contemporary section-wrap" id="contemporary" aria-labelledby="contemporary-title" data-scene-reveal>
    <AmbientMeteors />
    <div className="present-arrival" aria-hidden="true"><span className="present-year">2026</span><span className="present-rule" /><span className="present-label">时间走到这里，足迹仍在继续。</span></div>
    <div className="section-heading ending-heading"><div><p className="eyebrow">02 / 当代终章</p><h2 id="contemporary-title" tabIndex={-1}>把学习，写进今天。</h2></div><p>从历史中的青年，走到今天的我们。<br />九种匿名岗位，汇成同一部作品。</p></div>
    <div className="team-heading"><div><p className="eyebrow">共同创作 / OUR TEAM</p><h3>今天的我们——<br className="mobile-heading-break" />九份继续书写的足迹。</h3></div><span className="team-count">09<span>匿名共创岗位</span></span></div>
    <p className="team-credits-note">公开版只呈现匿名岗位与共同创作方法，不公开成员姓名、声音、照片、个人经历或内部确认材料。</p>
    <div ref={directory} className={"team-ensemble " + (selected ? "has-selection" : "")} aria-label="匿名共创岗位目录">
      <div className="team-directions" aria-label="创作方向"><span className="team-filter-label">创作方向</span>{directions.map((group) => <span key={group.id} className="team-filter-static">{group.label}<span className="direction-count" aria-hidden="true">{teamContent.members.filter((person) => creatorCredit(person.id)?.groupId === group.id).length}</span></span>)}</div>
      <div className="team-paper-groups">{directions.map((group) => <section key={group.id} className="team-paper-group" aria-label={group.note}>
        <div className="team-group-heading"><span aria-hidden="true">{group.mark}</span><div><h4>{group.title}</h4><p>{group.note}</p></div></div>
        <div className="team-paper-stack">{teamContent.members.filter((person) => creatorCredit(person.id)?.groupId === group.id).map((person) => {
          const note = teamContent.reflections.find((item) => item.memberId === person.id);
          return <button key={person.id} type="button" className="team-paper" data-member={person.id} aria-pressed={selected === person.id} aria-controls="member-dossier" aria-label={"阅读" + person.displayName + "的匿名创作档案"} onClick={() => select(person.id)}>
            <span className="paper-overline paper-credit">{creatorCredit(person.id)?.title ?? person.role}</span><strong>{person.displayName}</strong><span className="paper-role">{person.role}</span><span className="paper-format">匿名共创手记</span><span className="paper-excerpt">{note?.excerpt}</span><span className="paper-open">展开岗位手记 <span aria-hidden="true">↗</span></span>
          </button>;
        })}</div>
      </section>)}</div>
    </div>
    {member && reflection && <article ref={dossier} id="member-dossier" className="member-dossier" data-selected-member={member.id} aria-labelledby="member-dossier-title" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); returnToDirectory(); } }}>
      <div className="dossier-toolbar"><button onClick={returnToDirectory}>← 返回匿名岗位目录</button><span>共创手记 / 2026</span><div><button aria-label="前一岗位" onClick={() => step(-1)}>←</button><button aria-label="后一岗位" onClick={() => step(1)}>→</button></div></div>
      <nav className="member-switch-strip" aria-label="切换匿名共创岗位">{teamContent.members.map((person) => <button key={person.id} aria-current={selected === person.id} onClick={() => select(person.id)}>{person.displayName}</button>)}</nav>
      <header className="member-dossier-heading"><p className="eyebrow">{creatorCredit(member.id)?.title ?? member.role}</p><h4 id="member-dossier-title" tabIndex={-1}>{member.displayName}</h4><p className="member-credit-contribution">{member.role}</p>{reflection.excerpt && <blockquote>“{reflection.excerpt}”</blockquote>}</header>
      <div className="dossier-reading text-only"><div className="member-prose"><section><h5>岗位贡献</h5>{paragraphs(reflection.contribution)}</section><section><h5>公开版共创手记</h5>{paragraphs(reflection.displayText)}</section></div></div>
      <div className="dossier-bottom-nav"><button onClick={() => step(-1)}>← 前一岗位</button><button onClick={returnToDirectory}>匿名共创岗位</button><button onClick={() => step(1)}>后一岗位 →</button></div>
    </article>}
    <div className="ending-coda"><span className="coda-line" aria-hidden="true" /><p className="eyebrow">这一程，我们共同写下</p><p className="coda-title">历史留下足迹，<br />今天的我们，继续书写。</p><p>从一份史料、一段文字，到一次主动的探索。<br />让被读到的历史，成为可以继续讲述的故事。</p><button onClick={onHistory}>再走进历史 <Arrow direction="left" /></button></div>
    <div className="usage-statement"><h4>素材来源与使用声明</h4><p>公开版团队部分只呈现匿名岗位与去身份化的共同创作说明。真人录音、集体照片、开发纪事和内部身份材料不进入本公开构建。</p></div>
    <footer className="site-footer"><div><img className="university-seal footer-seal" src="./sysu-emblem-red.png" alt="中山大学红色校徽" /><strong>{site.title}</strong><span>{site.formalTitle}</span><small>{site.project}</small></div><a href="#home" onClick={(event) => { event.preventDefault(); onHome(); }}>返回首页 <Arrow direction="left" /></a><p>学生学习小组创作 · 非中山大学官方网站 · 当前页面不代表学校正式发布</p></footer>
  </section>;
}
