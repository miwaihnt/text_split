# Sentence Splitter API (Phase 2 Prototype)

FastAPI + NLTK `punkt` tokenizer prototype used to replace the regex-based sentence splitting.

## セットアップ
1. Python仮想環境を用意します。
2. 依存関係をインストールします。
   ```bash
   pip install -r requirements.txt
   ```
3. 初回実行時に `punkt` モデルが自動ダウンロードされます。

## 起動
```bash
uvicorn app.main:app --reload
```

- `/health`: ヘルスチェック
- `/split`: POST で `{ "text": "...", "remove_line_breaks": false }` を渡すと、`sent_tokenize` の結果を返します。

## テスト
```bash
pytest
```

テストは `tests/test_split.py` にあり、略語・複数文・行末句読点などの代表パターンをカバーします。
