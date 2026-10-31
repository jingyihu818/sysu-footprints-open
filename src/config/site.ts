import type { Period } from "../types/content";
export const site = {
  title: "足迹",
  formalTitle: "《足迹》——中山大学百年红色足迹，一张地图上的党史与校史",
  subtitle: "一张地图上的党史与校史",
  introduction:
    "以地图为线索，以史料为依据，在时间与地点之间，读懂校园的红色记忆。",
  project: "中山大学2026年学生入党发展对象培训班网络文化作品",
};
// 用户提供的暂定章节规划，不属于已审核历史事实。
export const periods: Period[] = [
  {
    id: "p1924",
    range: "1924—1926",
    title: "创校与革命思想传播",
    note: "暂定章节",
  },
  { id: "p1927", range: "1927", title: "历史转折", note: "暂定章节" },
  {
    id: "p1938",
    range: "1938—1945",
    title: "抗战迁校与党组织活动",
    note: "暂定章节",
  },
  {
    id: "p1947",
    range: "1947",
    title: "学生爱国民主运动",
    note: "扩展节点 · 暂定章节",
  },
  { id: "p2026", range: "2026", title: "当代学习与实践", note: "进入当代终章" },
];
