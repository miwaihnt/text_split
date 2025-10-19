export type ChunkPreview = {
  id: number;
  sentences: string[];
  tokenCount: number;
  indices: number[];
};

const tokenizeSentence = (text: string) => {
  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean).length;
  return Math.max(1, tokens);
};

const buildOverlap = ({
  sentences,
  indices,
  overlapTokens
}: {
  sentences: string[];
  indices: number[];
  overlapTokens: number;
}) => {
  if (overlapTokens <= 0 || sentences.length === 0) {
    return {
      overlapSentences: [] as string[],
      overlapIndices: [] as number[],
      overlapTokenCount: 0
    };
  }

  const overlapSentences: string[] = [];
  const overlapIndices: number[] = [];
  let overlapTokenCount = 0;

  for (let cursor = sentences.length - 1; cursor >= 0; cursor -= 1) {
    const sentence = sentences[cursor];
    const tokenCount = tokenizeSentence(sentence);

    overlapSentences.unshift(sentence);
    overlapIndices.unshift(indices[cursor]);
    overlapTokenCount += tokenCount;

    if (overlapTokenCount >= overlapTokens) {
      break;
    }
  }

  return { overlapSentences, overlapIndices, overlapTokenCount };
};

export const chunkSentences = (
  sentences: string[],
  maxTokens: number,
  overlapTokens: number
): ChunkPreview[] => {
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
    return [];
  }

  const normalizedOverlap = Math.max(0, Math.floor(overlapTokens));
  const normalizedMaxTokens = Math.max(1, Math.floor(maxTokens));

  const result: ChunkPreview[] = [];
  let currentSentences: string[] = [];
  let currentIndices: number[] = [];
  let currentTokens = 0;

  const pushCurrentChunk = () => {
    if (currentSentences.length === 0) {
      return;
    }

    result.push({
      id: result.length + 1,
      sentences: [...currentSentences],
      tokenCount: currentTokens,
      indices: [...currentIndices]
    });
  };

  sentences.forEach((sentence, index) => {
    const sentenceTokenCount = tokenizeSentence(sentence);

    if (sentenceTokenCount > normalizedMaxTokens) {
      pushCurrentChunk();

      result.push({
        id: result.length + 1,
        sentences: [sentence],
        tokenCount: sentenceTokenCount,
        indices: [index]
      });

      currentSentences = [];
      currentIndices = [];
      currentTokens = 0;
      return;
    }

    if (currentTokens + sentenceTokenCount > normalizedMaxTokens && currentSentences.length) {
      const { overlapSentences, overlapIndices, overlapTokenCount } = buildOverlap({
        sentences: currentSentences,
        indices: currentIndices,
        overlapTokens: normalizedOverlap
      });

      pushCurrentChunk();

      currentSentences = overlapSentences;
      currentIndices = overlapIndices;
      currentTokens = overlapTokenCount;
    }

    currentSentences.push(sentence);
    currentIndices.push(index);
    currentTokens += sentenceTokenCount;
  });

  pushCurrentChunk();

  return result;
};
