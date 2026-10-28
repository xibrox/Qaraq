/**
 * Categorical series colours for Stats charts, in fixed order (AniClient's Top Genres donut:
 * blue, green, yellow, red, purple). Charts always pair them with labelled legends.
 */
export const CHART_COLORS = ['#4F9BE0', '#4CC266', '#F2C230', '#E5484D', '#A66BD3', '#F28C3A', '#3FC1C9', '#E86FB0'] as const;

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
