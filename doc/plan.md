# 🧠 Sentence Splitter for AI – 要件定義書（Regex版MVP）

## 🎯 目的・コンセプト
英語テキストを **AI処理（LLM・RAGなど）向けに1文ごとに整形し、JSON形式で出力するWebツール。**  
会員登録不要・無料・即利用できる「AIエンジニア／翻訳者向けユーティリティ」。

## 🌍 ターゲットユーザー
- LLMやRAGの前処理を行う **AIエンジニア／データサイエンティスト**

## 💡 主要機能
| 機能カテゴリ | 内容 |
| --- | --- |
| 1. テキスト入力 | 長文英語をペーストできる `Textarea`（最大5,000文字） |
| 2. オプション設定 | チェックボックスで機能切替：<br>・Remove Line Breaks<br>・Keep punctuation（ON by default）<br>・Output as JSON |
| 3. 分割実行 | ボタン（"Split Sentences"）押下でRegex分割を実行 |
| 4. 出力エリア | - JSON形式出力（`["sentence1", "sentence2", ...]`）<br>- プレーンテキスト出力（番号付き） |
| 5. コピー機能 | `Copy JSON` / `Copy Plain Text` ボタン |
| 6. 広告配置 | - 上部：728x90（横長バナー）<br>- 出力下部：300x250レスポンシブ（AdSense想定） |
| 7. エラー処理 | 未入力時は警告表示（例："Please enter some text.") |

## ⚙️ 分割アルゴリズム（Regex版）
```javascript
const splitText = (text) => {
  // 改行削除（オプション指定時）
  const cleanText = text.replace(/\n+/g, " ").trim();

  // 正規表現による文分割
  // 区切り条件： . ! ? の後に空白 or 改行がある場合
  const sentences = cleanText.split(/(?<=[.!?])\s+/);

  // 空要素を除外
  return sentences.filter((s) => s.length > 0);
};
```

## 🚀 MVPロードマップ
| フェーズ | 内容 | 技術 |
| --- | --- | --- |
| Phase 1（MVP） | Regex版（ブラウザ完結）リリース | Next.js / Tailwind / Regex |
| Phase 2（改良版） | Cloud Function経由でNLTK “punkt”対応 | Python + FastAPI + GCF |
| Phase 3（Pro版） | 有料APIモード（OpenAI分割 or LangChain） | Node + OpenAI API |
| Phase 4 | SEO強化（英語ブログ＋内部リンク） | Markdown記事＋Next SEO |

## 📈 収益設計
| 要素 | 内容 |
| --- | --- |
| 広告モデル | Google AdSense（上部・下部・出力下） |
| 想定CTR | 約1.5%（ツール系平均） |
| PV目標 | 月間10〜15万PV |
| 収益目安 | 約¥50,000/月 |

---

## ✅ 実装状況チェックリスト
- [x] Next.js 14 + TypeScript + Tailwind のMVPプロジェクト構成を用意
- [x] 最大5,000文字対応のテキスト入力欄とオプション切り替えUIを実装
- [x] 正規表現による文分割ロジック（行末句読点＋空白検知）を実装
- [x] JSON配列と番号付きプレーンテキストの出力切り替え＋コピー機能
- [x] 未入力時および文検出失敗時のエラーメッセージ表示
- [x] 上部728×90／下部300×250の広告プレースホルダーを配置
- [ ] 分割処理の自動テスト整備
- [ ] デプロイ／SEO対策／後続フェーズ実装

## 🧪 Phase 2（NLTK API）プロトタイピング計画
- [x] Python / FastAPI プロジェクトを作成し、NLTKと依存パッケージを定義する
- [x] `punkt` モデルのダウンロードをビルドまたは起動時に実行する初期化処理を実装
- [x] `/split` POSTエンドポイントを実装し、`sent_tokenize` でJSON配列を返す
- [x] 既存のテストケースをAPI経由で検証するスクリプト／自動テストを用意
- [x] Next.jsフロントエンドの分割処理をAPI呼び出し方式へ差し替える
- [ ] 通信エラー・タイムアウト時のユーザーメッセージとロギングを整備
- [ ] デプロイ候補（GCF / Cloud Run）での動作検証と手順の下書きを作成
- [ ] テキストファイルアップロード入力とAPI連携パイプラインを実装
- [ ] JSON出力のエクスポート（ダウンロード）機能を追加
- [ ] RAG向けチャンク生成オプションの要件検討

### ローカル統合メモ
- FastAPIはCORSを全許可に設定済み（`api/app/main.py`）のため、Next.jsから直接 `http://127.0.0.1:8000` へアクセス可能。
- フロントエンドは `NEXT_PUBLIC_SENTENCE_API_BASE_URL` を指定すれば任意のエンドポイントに切り替え可能（未指定時は `http://127.0.0.1:8000`）。
- 両方のサーバーを同時に起動することで、ブラウザ上からNLTKベースの分割結果を確認できる。
