export interface RouteAvailability { schoolEventId: string | null; imageId: string | null; imageEventId?: string | null; organizationEventId: string | null; dossierAvailable: boolean }
export interface RecommendedRouteStep { id: string; label: string; description: string; available: boolean; target: string | null }
export function buildRecommendedRoute(value: RouteAvailability): RecommendedRouteStep[] {
  return [
    { id: "home", label: "首页电影式进入", description: "从首页开始，沿着时间进入探索。", available: true, target: "home" },
    { id: "map", label: "抗战迁校地图", description: "先从地图理解地点与关系。", available: Boolean(value.schoolEventId), target: value.schoolEventId },
    { id: "archive", label: "澄江学校档案", description: "打开学校迁校的历史档案。", available: Boolean(value.schoolEventId), target: value.schoolEventId },
    { id: "image", label: "一张历史图片", description: "从档案中的影像附页继续阅读。", available: Boolean(value.imageId), target: value.imageEventId ?? null },
    { id: "organization", label: "红色组织活动视角", description: "切换到同一时空中的组织线索。", available: Boolean(value.organizationEventId), target: value.organizationEventId },
    { id: "dossier", label: "1947 六页卷宗", description: "沿着事件页继续读到背景、游行与纪念。", available: value.dossierAvailable, target: value.dossierAvailable ? "p1947" : null },
    { id: "ending", label: "今天的我们", description: "进入九人创作足迹终章。", available: true, target: "contemporary" },
  ];
}
