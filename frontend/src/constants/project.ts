export const PROJECET_COLORS = {
  RED: "#EF4444",
  ORANGE: "#F97316",
  AMBER: "#F59E0B",
  EMERALD: "#10B981",
  BLUE: "#3B82F6",
  INDIGO: "#6366F1",
  VIOLET: "#8B5CF6",
  PINK: "#EC4899",
} as const;

export type ProjectColorKey = keyof typeof PROJECET_COLORS;
export type ProjectColorValue = (typeof PROJECET_COLORS)[ProjectColorKey];

export const PROJECET_COLORS_VALUES = Object.values(PROJECET_COLORS);
