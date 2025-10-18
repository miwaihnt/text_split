# 分割ロジック手動テスト結果

- 実行日時: 2025-10-17 22:07:20 JST
- オプション設定: `removeLineBreaks = false`, `keepPunctuation = true`

| ID | シナリオ | 入力 | 期待される出力 | 実際の出力 | 判定 |
| --- | --- | --- | --- | --- | --- |
| A1 | 敬称略語を含む1文 | `Dr. Smith met Mr. Johnson.` | `["Dr. Smith met Mr. Johnson."]` | `["Dr.", "Smith met Mr.", "Johnson."]` | NG |
| A2 | 国名略語 | `They travelled across the U.S. in 2023.` | `["They travelled across the U.S. in 2023."]` | `["They travelled across the U.S.", "in 2023."]` | NG |
| A3 | 企業役職略語 | `The C.E.O. approved it.` | `["The C.E.O. approved it."]` | `["The C.E.O.", "approved it."]` | NG |
| A4 | 複数略語＋文末句 | `Dr. Smith stayed in the U.S. for the Ph.D. program.` | `["Dr. Smith stayed in the U.S. for the Ph.D. program."]` | `["Dr.", "Smith stayed in the U.S.", "for the Ph.D.", "program."]` | NG |
| B1 | 略語を含む複数文 | `Dr. Smith met with Mr. Johnson in the U.S. They discussed A.I. regulation.` | `["Dr. Smith met with Mr. Johnson in the U.S.", "They discussed A.I. regulation."]` | `["Dr.", "Smith met with Mr.", "Johnson in the U.S.", "They discussed A.I.", "regulation."]` | NG |
| B2 | 略語＋疑問・感嘆 | `Are we sure about the U.N. decision? Yes, Dr. Wong confirmed!` | `["Are we sure about the U.N. decision?", "Yes, Dr. Wong confirmed!"]` | `["Are we sure about the U.N.", "decision?", "Yes, Dr.", "Wong confirmed!"]` | NG |
| B3 | 略語＋数値 | `Prof. Adams earned $1.5M.` | `["Prof. Adams earned $1.5M."]` | `["Prof.", "Adams earned $1.5M."]` | NG |
| B4 | 時刻表現 | `We met at 10 a.m. sharp.` | `["We met at 10 a.m. sharp."]` | `["We met at 10 a.m.", "sharp."]` | NG |
| C1 | 列挙ラベル | `Tasks include A. research, B. design, and C. deployment.` | `["Tasks include A. research, B. design, and C. deployment."]` | `["Tasks include A.", "research, B.", "design, and C.", "deployment."]` | NG |
| C2 | URLと略語 | `Visit example.com. Then contact Dr. Lee.` | `["Visit example.com.", "Then contact Dr. Lee."]` | `["Visit example.com.", "Then contact Dr.", "Lee."]` | NG |

> すべてのケースで略語に伴う不適切な分割が発生しました。略語辞書や前後文脈の判定ルール追加が必要です。
