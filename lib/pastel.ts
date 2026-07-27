export const PASTEL_BANDS = [
  { bg: "bg-pastel-pink-bg", border: "border-pastel-pink", dot: "bg-pastel-pink" },
  { bg: "bg-pastel-peach-bg", border: "border-pastel-peach", dot: "bg-pastel-peach" },
  { bg: "bg-pastel-yellow-bg", border: "border-pastel-yellow", dot: "bg-pastel-yellow" },
  { bg: "bg-pastel-mint-bg", border: "border-pastel-mint", dot: "bg-pastel-mint" },
  { bg: "bg-pastel-sky-bg", border: "border-pastel-sky", dot: "bg-pastel-sky" },
  { bg: "bg-pastel-lavender-bg", border: "border-pastel-lavender", dot: "bg-pastel-lavender" },
] as const;

export function pastelForIndex(index: number) {
  return PASTEL_BANDS[((index % PASTEL_BANDS.length) + PASTEL_BANDS.length) % PASTEL_BANDS.length];
}
