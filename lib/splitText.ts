export type SplitOptions = {
  removeLineBreaks: boolean;
  keepPunctuation: boolean;
};

const sentenceDelimiter = /(?<=[.!?])\s+/;
const trailingPunctuation = /[.!?]+$/;

export const splitText = (rawText: string, options: SplitOptions) => {
  const trimmed = rawText.trim();

  if (!trimmed) {
    return [];
  }

  const normalized = options.removeLineBreaks
    ? trimmed.replace(/\s*\n+\s*/g, " ")
    : trimmed.replace(/\r/g, "");

  const sanitized = options.removeLineBreaks
    ? normalized.replace(/\s{2,}/g, " ")
    : normalized.replace(/[ \t]{2,}/g, " ");

  const fragments = sanitized
    .split(sentenceDelimiter)
    .map((fragment) => fragment.trim())
    .filter(Boolean);

  if (fragments.length === 0) {
    return [];
  }

  if (options.keepPunctuation) {
    return fragments;
  }

  return fragments.map((fragment) => fragment.replace(trailingPunctuation, "").trim());
};

export const stripTrailingPunctuation = (text: string) =>
  text.replace(trailingPunctuation, "").trim();
