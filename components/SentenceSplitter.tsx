"use client";

import { useMemo, useRef, useState } from "react";
import { splitTextViaApi } from "@/lib/api";
import { chunkSentences } from "@/lib/chunkSentences";
import { stripTrailingPunctuation, type SplitOptions } from "@/lib/splitText";

const MAX_CHAR_COUNT = 10000;
const TEXT_FILE_PATTERN = /\.(txt|md|csv)$/i;

const isTextFile = (file: File) =>
  file.type.startsWith("text/") || TEXT_FILE_PATTERN.test(file.name);

const defaultOptions: SplitOptions & { outputAsJson: boolean } = {
  removeLineBreaks: false,
  keepPunctuation: true,
  outputAsJson: true
};

const SentenceSplitter = () => {
  const [inputText, setInputText] = useState("");
  const [options, setOptions] = useState(defaultOptions);
  const [sentences, setSentences] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"json" | "text" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [maxTokensInput, setMaxTokensInput] = useState("512");
  const [overlapTokensInput, setOverlapTokensInput] = useState("64");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const characterCount = inputText.length;

  const handleToggle = (key: keyof typeof defaultOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const processTextFiles = async (fileList: FileList | File[]) => {
    const textFiles = Array.from(fileList).filter(isTextFile);

    if (textFiles.length === 0) {
      setError("Only text-based files are supported.");
      return;
    }

    try {
      const contents = await Promise.all(textFiles.map((file) => file.text()));
      const joined = contents.map((content) => content.replace(/\r/g, "")).join("\n\n");

      if (!joined.trim()) {
        setError("Selected files were empty.");
        return;
      }

      let truncated = false;
      let nextTextValue = joined;

      if (joined.length > MAX_CHAR_COUNT) {
        truncated = true;
        nextTextValue = joined.slice(0, MAX_CHAR_COUNT);
      }

      setInputText(nextTextValue);
      setSentences([]);
      setCopyState(null);
      setError(truncated ? "Content truncated to first 10,000 characters." : null);
    } catch (fileError) {
      console.error("Failed to read text files", fileError);
      setError("Failed to read file content.");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const { files } = input;

    if (!files || files.length === 0) {
      return;
    }

    await processTextFiles(files);
    input.value = "";
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (!isDragActive) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    const dataTransfer = event.dataTransfer;
    const { files } = dataTransfer;

    if (!files || files.length === 0) {
      return;
    }

    await processTextFiles(files);
    dataTransfer.clearData();
  };

  const handleSplit = async () => {
    const trimmedInput = inputText.trim();

    if (!trimmedInput) {
      setError("Please enter some text.");
      setSentences([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { keepPunctuation, removeLineBreaks } = options;
      const { sentences: apiSentences } = await splitTextViaApi({
        text: trimmedInput,
        removeLineBreaks
      });
      const processed = keepPunctuation
        ? apiSentences
        : apiSentences.map((sentence) => stripTrailingPunctuation(sentence));

      setSentences(processed);
      setError(
        processed.length === 0
          ? "We couldn't detect sentence boundaries. Try enabling punctuation or adding separators."
          : null
      );
    } catch (apiError) {
      const message =
        apiError instanceof Error ? apiError.message : "Failed to split sentences.";
      setError(message);
      setSentences([]);
    } finally {
      setIsLoading(false);
      setCopyState(null);
    }
  };

  const handleReset = () => {
    setInputText("");
    setSentences([]);
    setCopyState(null);
    setError(null);
    setIsLoading(false);
  };

  const jsonOutput = useMemo(() => JSON.stringify(sentences, null, 2), [sentences]);

  const plainTextOutput = useMemo(
    () => sentences.map((sentence, index) => `${index + 1}. ${sentence}`).join("\n"),
    [sentences]
  );

  const parsedMaxTokens = useMemo(() => {
    const parsed = Math.floor(Number(maxTokensInput));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 1;
    }
    return parsed;
  }, [maxTokensInput]);

  const parsedOverlapTokens = useMemo(() => {
    const parsed = Math.floor(Number(overlapTokensInput));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return Math.min(parsed, parsedMaxTokens);
  }, [overlapTokensInput, parsedMaxTokens]);

  const chunkPreview = useMemo(
    () => chunkSentences(sentences, parsedMaxTokens, parsedOverlapTokens),
    [sentences, parsedMaxTokens, parsedOverlapTokens]
  );

  const handleMaxTokensChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/[^\d]/g, "");
    setMaxTokensInput(nextValue);
  };

  const handleOverlapTokensChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/[^\d]/g, "");
    setOverlapTokensInput(nextValue);
  };

  const handleMaxTokensBlur = () => {
    const sanitizedMax = String(parsedMaxTokens);
    if (sanitizedMax !== maxTokensInput) {
      setMaxTokensInput(sanitizedMax);
    }

    const clampedOverlap = String(parsedOverlapTokens);
    if (clampedOverlap !== overlapTokensInput) {
      setOverlapTokensInput(clampedOverlap);
    }
  };

  const handleOverlapTokensBlur = () => {
    const sanitizedOverlap = String(parsedOverlapTokens);
    if (sanitizedOverlap !== overlapTokensInput) {
      setOverlapTokensInput(sanitizedOverlap);
    }
  };

  const handleCopy = async (type: "json" | "text") => {
    const value = type === "json" ? jsonOutput : plainTextOutput;

    try {
      await navigator.clipboard.writeText(value);
      setCopyState(type);
      setTimeout(() => setCopyState(null), 1500);
    } catch (clipboardError) {
      console.error("Clipboard copy failed", clipboardError);
      setCopyState(null);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `sentences-${timestamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur md:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_55%)]"
        />
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              Built for LLM workflows
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-slate-50 md:text-4xl">
                Sentence Splitter for LLMs
              </h1>
              <p className="text-sm text-slate-200 md:text-lg">
                Split your text into clean, model-ready sentences for RAG, training, and evaluation.
              </p>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 md:w-72">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.removeLineBreaks}
                onChange={() => handleToggle("removeLineBreaks")}
                className="h-4 w-4 rounded border-white/30 bg-slate-900/80 text-amber-300 focus:ring-amber-300 focus:ring-offset-0"
              />
              Remove line breaks
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.keepPunctuation}
                onChange={() => handleToggle("keepPunctuation")}
                className="h-4 w-4 rounded border-white/30 bg-slate-900/80 text-amber-300 focus:ring-amber-300 focus:ring-offset-0"
              />
              Keep punctuation
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.outputAsJson}
                onChange={() => handleToggle("outputAsJson")}
                className="h-4 w-4 rounded border-white/30 bg-slate-900/80 text-amber-300 focus:ring-amber-300 focus:ring-offset-0"
              />
              Output as JSON
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label htmlFor="input-text" className="text-sm font-medium text-slate-200">
            Input text
          </label>
          <textarea
            id="input-text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            maxLength={MAX_CHAR_COUNT}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            placeholder="Paste your English text here..."
            className={`h-48 w-full resize-y rounded-2xl border ${
              isDragActive ? "border-amber-300 ring-2 ring-amber-300/40" : "border-white/15"
            } bg-slate-950/60 p-4 text-sm leading-6 text-slate-100 shadow-lg transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40`}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,text/plain"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>{characterCount.toLocaleString()} / 10,000 characters</span>
            {error ? <span className="text-amber-300">{error}</span> : null}
          </div>
          <p className="text-xs text-slate-400">
            Tip: Drag and drop multiple .txt, .md, or .csv files to populate the input.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSplit}
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-200"
              disabled={!characterCount || isLoading}
            >
              {isLoading ? "Splitting…" : "Split sentences"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!characterCount || isLoading}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={triggerFileSelect}
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Upload text files
            </button>
            {sentences.length > 0 ? (
              <p className="text-xs text-slate-200">{sentences.length} sentences detected.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Output</h2>
          {sentences.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">
              Run the splitter to see JSON and plain text output formats.
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              {options.outputAsJson ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-200">
                    <h3 className="text-sm font-medium">JSON Array</h3>
                    <button
                      type="button"
                      onClick={() => handleCopy("json")}
                      className="text-xs font-medium text-amber-300 hover:underline"
                    >
                      {copyState === "json" ? "Copied!" : "Copy JSON"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadJson}
                      className="text-xs font-medium text-amber-300 hover:underline"
                    >
                      Download JSON
                    </button>
                  </div>
                  <pre className="max-h-64 overflow-auto rounded-2xl bg-slate-950/90 p-4 text-xs text-slate-100 ring-1 ring-white/10">
                    {jsonOutput}
                  </pre>
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-200">
                  <h3 className="text-sm font-medium">Plain Text</h3>
                  <button
                    type="button"
                    onClick={() => handleCopy("text")}
                    className="text-xs font-medium text-amber-300 hover:underline"
                  >
                    {copyState === "text" ? "Copied!" : "Copy Plain Text"}
                  </button>
                </div>
                <pre className="max-h-64 overflow-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-slate-100 ring-1 ring-white/10">
                  {plainTextOutput}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Chunk preview</h2>
              <p className="mt-1 text-xs text-slate-300">
                Visualize approximate chunking with token limits and overlap.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-slate-200">
                Max tokens
                <input
                  type="number"
                  min={1}
                  value={maxTokensInput}
                  onChange={handleMaxTokensChange}
                  onBlur={handleMaxTokensBlur}
                  inputMode="numeric"
                  className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-200">
                Overlap tokens
                <input
                  type="number"
                  min={0}
                  value={overlapTokensInput}
                  onChange={handleOverlapTokensChange}
                  onBlur={handleOverlapTokensBlur}
                  inputMode="numeric"
                  className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                />
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Token counts are approximated by whitespace splitting for quick insight.
            </p>
          </div>
          <div className="mt-6 space-y-4">
            {chunkPreview.length === 0 ? (
              <p className="text-sm text-slate-300">
                Run the splitter to explore how chunks are distributed.
              </p>
            ) : (
              chunkPreview.map((chunk) => {
                const startIndex = chunk.indices.length > 0 ? chunk.indices[0] + 1 : undefined;
                const endIndex =
                  chunk.indices.length > 0
                    ? chunk.indices[chunk.indices.length - 1] + 1
                    : startIndex;

                return (
                  <div
                    key={chunk.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs text-slate-100 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-slate-200">
                      <h3 className="text-sm font-semibold">Chunk {chunk.id}</h3>
                      <span className="text-xs text-amber-300">
                        {chunk.tokenCount.toLocaleString()} tokens
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Sentences: {chunk.sentences.length.toLocaleString()} •{" "}
                      {typeof startIndex === "number" && typeof endIndex === "number" ? (
                        <>Range #{startIndex}–{endIndex}</>
                      ) : (
                        <>Range unavailable</>
                      )}
                    </p>
                    <div className="mt-3 space-y-2 rounded-xl bg-slate-900/80 p-3 ring-1 ring-white/5">
                      {chunk.sentences.map((sentence, idx) => (
                        <p
                          key={`${chunk.id}-${chunk.indices[idx] ?? idx}`}
                          className="text-slate-200"
                        >
                          <span className="mr-2 text-slate-500">
                            #
                            {chunk.indices[idx] !== undefined
                              ? chunk.indices[idx] + 1
                              : typeof startIndex === "number"
                              ? startIndex + idx
                              : idx + 1}
                          </span>
                          {sentence}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
          <h2 className="text-base font-semibold text-white">How it works</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-300">
            <li>Trim the input and optionally collapse line breaks.</li>
            <li>Split sentences with regex on `.`, `!`, `?` followed by whitespace.</li>
            <li>Remove trailing punctuation when toggled off.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SentenceSplitter;
