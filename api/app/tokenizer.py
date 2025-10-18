from __future__ import annotations

from functools import lru_cache
from typing import Iterable

from nltk.tokenize.punkt import PunktParameters, PunktSentenceTokenizer

# Training corpus includes common abbreviations to guide punkt heuristics.
_TRAINING_TEXT = """
Dr. Smith met Mr. Johnson in the U.S. They discussed A.I. regulation with the U.N.
Prof. Adams earned $1.5M. We met at 10 a.m. sharp. Tasks include A. research, B. design, and C. deployment.
Visit example.com. Then contact Dr. Lee. The C.E.O. approved it. Dr. Smith stayed in the U.S. for the Ph.D. program. He asked, "Are you coming, Mr. Lee?" She nodded.
"""

_ABBREVIATIONS: Iterable[str] = {
    "dr",
    "mr",
    "mrs",
    "ms",
    "prof",
    "u.s",
    "u.s.a",
    "ph.d",
    "a.i",
    "u.n",
    "a.m",
    "p.m",
    "c.e.o",
    "inc",
    "ltd",
}


@lru_cache(maxsize=1)
def get_sentence_tokenizer() -> PunktSentenceTokenizer:
    params = PunktParameters()
    params.abbrev_types = {abbr.lower() for abbr in _ABBREVIATIONS}
    tokenizer = PunktSentenceTokenizer(params)
    tokenizer.train(_TRAINING_TEXT)
    tokenizer._params.sent_starters.update(
        {
            'they',
            'we',
            'yes',
            'visit',
            'then',
            'prof',
            'tasks',
            'are',
            'the',
            'she'
        }
    )
    return tokenizer
