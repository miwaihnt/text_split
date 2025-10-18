"use client";

import { useMemo, useRef, useState } from "react";
import { splitTextViaApi } from "@/lib/api";
import { stripTrailingPunctuation, type SplitOptions } from "@/lib/splitText";
import AdSlot from "./AdSlot";

const MAX_CHAR_COUNT = 10000;

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const characterCount = inputText.length;

  const handleToggle = (key: keyof typeof defaultOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size === 0) {
      setError("Selected file is empty.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (!text) {
        setError("Failed to read file content.");
        event.target.value = "";
        return;
      }

      let nextText = text;
      let nextError: string | null = null;

      if (text.length > MAX_CHAR_COUNT) {
        nextText = text.slice(0, MAX_CHAR_COUNT);
        nextError = "File truncated to first 5,000 characters.";
      }

      setInputText(nextText);
      setSentences([]);
      setCopyState(null);
      setError(nextError);
      event.target.value = "";
    };

    reader.onerror = () => {
      setError("Failed to read file content.");
      event.target.value = "";
    };

    reader.readAsText(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
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
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-3">
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              Sentence Splitter for AI
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Paste up to 5,000 characters of English text and split it into clean sentences ready
              for LLM and RAG pipelines. Export as JSON or copy a numbered plain text list.
            </p>
          </div>
          <div className="grid gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.removeLineBreaks}
                onChange={() => handleToggle("removeLineBreaks")}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Remove line breaks
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.keepPunctuation}
                onChange={() => handleToggle("keepPunctuation")}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Keep punctuation
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.outputAsJson}
                onChange={() => handleToggle("outputAsJson")}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Output as JSON
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label htmlFor="input-text" className="text-sm font-medium text-slate-700">
            Input text
          </label>
          <textarea
            id="input-text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            maxLength={MAX_CHAR_COUNT}
            placeholder="Paste your English text here..."
            className="h-48 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-6 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,text/plain"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{characterCount.toLocaleString()} / 10,000 characters</span>
            {error ? <span className="text-red-500">{error}</span> : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSplit}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!characterCount || isLoading}
            >
              {isLoading ? "Splitting…" : "Split sentences"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!characterCount || isLoading}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={triggerFileSelect}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              Upload text file
            </button>
            {sentences.length > 0 ? (
              <p className="text-xs text-slate-500">{sentences.length} sentences detected.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
            <h2 className="text-lg font-semibold text-slate-900">Output</h2>
            {sentences.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                Run the splitter to see JSON and plain text output formats.
              </p>
            ) : (
              <div className="mt-4 space-y-6">
                {options.outputAsJson ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-700">JSON Array</h3>
                      <button
                        type="button"
                        onClick={() => handleCopy("json")}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {copyState === "json" ? "Copied!" : "Copy JSON"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadJson}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Download JSON
                      </button>
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900/95 p-4 text-xs text-slate-50">
                      {jsonOutput}
                    </pre>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-700">Plain Text</h3>
                    <button
                      type="button"
                      onClick={() => handleCopy("text")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {copyState === "text" ? "Copied!" : "Copy Plain Text"}
                    </button>
                  </div>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-slate-100 p-4 text-xs text-slate-800">
                    {plainTextOutput}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
            <h2 className="text-base font-semibold text-slate-900">How it works</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-600">
              <li>Trim the input and optionally collapse line breaks.</li>
              <li>Split sentences with regex on `.`, `!`, `?` followed by whitespace.</li>
              <li>Remove trailing punctuation when toggled off.</li>
            </ul>
          </div>
        </aside>
      </div>

      <AdSlot
        label="Responsive Ad"
        dimensions="300 × 250"
        className="mx-auto h-[250px] w-full max-w-[300px] sm:max-w-[320px]"
      />
    </section>
  );
};

export default SentenceSplitter;
