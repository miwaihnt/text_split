from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .tokenizer import get_sentence_tokenizer

app = FastAPI(title="Sentence Splitter API", description="NLTK punkt-based sentence tokenizer.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_tokenizer = get_sentence_tokenizer()

MERGE_ABBREVIATION_SUFFIXES = (
    "Mr.",
    "Mrs.",
    "Ms.",
    "Dr.",
    "Prof.",
    "Sr.",
    "Jr.",
)

MAX_CHAR_LIMIT = 10_000


def merge_abbreviation_fragments(chunks: list[str]) -> list[str]:
    if not chunks:
        return []

    merged: list[str] = []

    for chunk in chunks:
        if merged and _should_merge_with_previous(merged[-1], chunk):
            merged[-1] = f"{merged[-1].rstrip()} {chunk.lstrip()}".strip()
        else:
            merged.append(chunk)

    return merged


def _should_merge_with_previous(previous: str, current: str) -> bool:
    prev_trimmed = previous.rstrip()

    if not any(prev_trimmed.endswith(abbreviation) for abbreviation in MERGE_ABBREVIATION_SUFFIXES):
        return False

    # If the current fragment starts with closing punctuation or quotes, it is likely a continuation.
    current_stripped = current.lstrip()
    if current_stripped and current_stripped[0] in {'"', "”", "'", "’"}:
        return True

    # Otherwise merge only when we are still inside the same quoted sentence.
    return True


class SplitRequest(BaseModel):
    text: str = Field(..., description="Input English text to split.")
    remove_line_breaks: bool = Field(
        default=False,
        description="Collapse line breaks into spaces before tokenization."
    )


class SplitResponse(BaseModel):
    sentences: List[str]


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/split", response_model=SplitResponse)
async def split_text(payload: SplitRequest) -> SplitResponse:
    text = payload.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Input text must not be empty.")

    if len(text) > MAX_CHAR_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Input exceeds the {MAX_CHAR_LIMIT:,} character limit."
        )

    processed = " ".join(line.strip() for line in text.splitlines()) if payload.remove_line_breaks else text

    try:
        sentences = [sentence.strip() for sentence in _tokenizer.tokenize(processed) if sentence.strip()]
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail="Sentence splitting failed.") from exc

    merged = merge_abbreviation_fragments(sentences)

    return SplitResponse(sentences=merged)
