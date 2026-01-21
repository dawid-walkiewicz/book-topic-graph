// 20 distinct colors for topics - RGBA format for Deck.gl
export const TOPIC_COLORS: Record<number, [number, number, number, number]> = {
  0:  [228, 26, 28, 220],    // Red
  1:  [55, 126, 184, 220],   // Blue
  2:  [77, 175, 74, 220],    // Green
  3:  [152, 78, 163, 220],   // Purple
  4:  [255, 127, 0, 220],    // Orange
  5:  [255, 255, 51, 220],   // Yellow
  6:  [166, 86, 40, 220],    // Brown
  7:  [247, 129, 191, 220],  // Pink
  8:  [153, 153, 153, 220],  // Gray
  9:  [0, 128, 128, 220],    // Teal
  10: [128, 0, 0, 220],      // Maroon
  11: [0, 0, 128, 220],      // Navy
  12: [128, 128, 0, 220],    // Olive
  13: [0, 128, 0, 220],      // Dark Green
  14: [70, 130, 180, 220],   // Steel Blue
  15: [138, 43, 226, 220],   // Blue Violet
  16: [220, 20, 60, 220],    // Crimson
  17: [46, 139, 87, 220],    // Sea Green
  18: [255, 215, 0, 220],    // Gold
  19: [139, 69, 19, 220],    // Saddle Brown
};

export const TOPIC_LABELS: Record<number, string> = {
  0: "High Fantasy & Epic Sagas",
  1: "Domestic Drama & Contemporary Fiction",
  2: "Historical Memoirs & Period Chronicles",
  3: "Classic Children's Literature & Oz Retellings",
  4: "Military Science Fiction & Space Opera",
  5: "Detective Fiction & Police Procedurals",
  6: "American Literary Classics",
  7: "Historical Intrigue & Romantic Epics",
  8: "Military History & Alternative WW2",
  9: "European Historical Epics & Tragedies",
  10: "Social Dynamics & Cultural Identity",
  11: "Dystopian Fiction & Hard Sci-Fi",
  12: "Postcolonial Indian Literature & Satire",
  13: "Philosophy, Economics & Evolutionary Theory",
  14: "Nautical Adventure & Naval Warfare",
  15: "Urban Fantasy & Supernatural Lore",
  16: "East Asian History & Mythology",
  17: "Classical Antiquity & Greek Philosophy",
  18: "Star Wars Expanded Universe",
  19: "Judge Dee Historical Mysteries",
};

export const DEFAULT_COLOR: [number, number, number, number] = [128, 128, 128, 200];
export const NEW_BOOK_HIGHLIGHT_COLOR: [number, number, number, number] = [255, 215, 0, 255]; // Gold ring

export function getTopicColor(topic: number | undefined | null): [number, number, number, number] {
  if (topic === undefined || topic === null) return DEFAULT_COLOR;
  return TOPIC_COLORS[topic] ?? DEFAULT_COLOR;
}
