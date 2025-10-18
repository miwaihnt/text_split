import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TEST_CASES = [
    (
        "A1",
        "敬称略語を含む1文",
        "Dr. Smith met Mr. Johnson.",
        ["Dr. Smith met Mr. Johnson."],
    ),
    (
        "A2",
        "国名略語",
        "They travelled across the U.S. in 2023.",
        ["They travelled across the U.S. in 2023."],
    ),
    (
        "A3",
        "企業役職略語",
        "The C.E.O. approved it.",
        ["The C.E.O. approved it."],
    ),
    (
        "A4",
        "複数略語＋文末句",
        "Dr. Smith stayed in the U.S. for the Ph.D. program.",
        ["Dr. Smith stayed in the U.S. for the Ph.D. program."],
    ),
    (
        "B1",
        "略語を含む複数文",
        "Dr. Smith met with Mr. Johnson in the U.S. They discussed A.I. regulation.",
        [
            "Dr. Smith met with Mr. Johnson in the U.S.",
            "They discussed A.I. regulation.",
        ],
    ),
    (
        "B2",
        "略語＋疑問・感嘆",
        "Are we sure about the U.N. decision? Yes, Dr. Wong confirmed!",
        [
            "Are we sure about the U.N. decision?",
            "Yes, Dr. Wong confirmed!",
        ],
    ),
    (
        "B3",
        "略語＋数値",
        "Prof. Adams earned $1.5M.",
        ["Prof. Adams earned $1.5M."],
    ),
    (
        "B4",
        "時刻表現",
        "We met at 10 a.m. sharp.",
        ["We met at 10 a.m. sharp."],
    ),
    (
        "B5",
        "引用内の敬称＋疑問文",
        "He asked, \"Are you coming, Mr. Lee?\" She nodded.",
        ["He asked, \"Are you coming, Mr. Lee?\"", "She nodded."],
    ),
    (
        "C1",
        "列挙ラベル",
        "Tasks include A. research, B. design, and C. deployment.",
        ["Tasks include A. research, B. design, and C. deployment."],
    ),
    (
        "C2",
        "URLと略語",
        "Visit example.com. Then contact Dr. Lee.",
        [
            "Visit example.com.",
            "Then contact Dr. Lee.",
        ],
    ),
]


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.parametrize("case_id, _description, text, expected", TEST_CASES)
def test_sentence_split_cases(case_id: str, _description: str, text: str, expected: list[str]) -> None:
    response = client.post("/split", json={"text": text})
    assert response.status_code == 200, f"Case {case_id} failed with status {response.status_code}"
    assert response.json()["sentences"] == expected


def test_rejects_empty_payload() -> None:
    response = client.post("/split", json={"text": "   "})
    assert response.status_code == 400
    assert response.json()["detail"] == "Input text must not be empty."


def test_remove_line_breaks_option() -> None:
    text = "Sentence one.\nSentence two."
    response = client.post(
        "/split",
        json={"text": text, "remove_line_breaks": True},
    )
    assert response.status_code == 200
    assert response.json()["sentences"] == ["Sentence one.", "Sentence two."]
