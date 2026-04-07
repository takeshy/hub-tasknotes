# CLAUDE.md — hub-tasknotes

## Project Overview

GemiHub用のタスク管理プラグイン。callumalpass/tasknotesのデータモデルに準拠。
各タスクはYAMLフロントマター付きMarkdownファイル（1ファイル1タスク）。

## Build & Test

```bash
npm run dev      # Watch mode
npm run build    # tsc + esbuild (production)
npm test         # vitest
```

## Architecture

- `src/types.ts` — Task型、設定型、CalendarEvent型
- `src/core/` — ビジネスロジック（serializer, formulas, recurrence, timeTracking, calendarSync, naturalLanguage）
- `src/ui/` — React UI（TaskPanel, TaskEditor, TaskListView, KanbanView, CalendarView, AgendaView, SettingsPanel）
- `src/store.ts` — pub/subグローバルストア
- `src/i18n.ts` — 英語・日本語翻訳
- `src/main.ts` — プラグインエントリポイント

## GemiHub Plugin API

- `api.gemini.chat()` — Gemini/Gemma LLM呼び出し
- `api.drive.*` — ファイルCRUD（IndexedDB local-first）
- `api.storage.*` — プラグインスコープのKV
- `api.calendar.*` — Google Calendar API（premium plan + calendar scope必須）
- `api.onActiveFileChanged()` — メインエディタのファイル変更イベント

## Data Model (callumalpass/tasknotes準拠)

- `due` — ハード期限（YYYY-MM-DD、日付のみ）
- `scheduled` — 実行予定日時（YYYY-MM-DD or YYYY-MM-DDTHH:MM）
- `contexts` — コンテキストタグ（@home, @work）
- `tags` — 分類タグ（contextsとは別）
- `blockedBy` / `blocking` — 依存関係（タスクIDの配列）
- `recurrence.recurrenceAnchor` — "scheduled" or "completion"
- `complete_instances` / `skipped_instances` — 繰り返しインスタンス管理
- `archived` — アーカイブ済みフラグ
- `completedDate` — 完了日時
- `timeEntries[].start` / `.end` — 時間記録

## AI Task Creation

- プレミアム: `gemini-3.1-flash-lite-preview`、無料: `gemma-4-31b-it`
- 初回呼び出しでモデルを自動検出しキャッシュ（`aiModelRef`）
- システムプロンプトで構造化JSONを返させ、TaskEditorに入力済みで表示

## 実装済み機能（以前は未実装だった項目）

以下は全て実装済み:

1. **recurrenceAnchor切替UI** — TaskEditorで繰り返し設定時に「予定日/期日基準」「完了日基準」を選択可能（i18n: `recurrenceAnchorScheduled`, `recurrenceAnchorCompletion`, `recurrenceAnchor`）
2. **blockedBy / blocking 編集UI** — TaskEditorにコンマ区切りテキスト入力。TaskListViewにブロック元バッジ表示
3. **archived 操作UI** — TaskEditorにアーカイブ/解除ボタン（即時保存）、ツールバーに「アーカイブ済みを表示」トグル、デフォルト`hideArchived: true`
4. **skipped_instances UI** — `TaskService.skip()`メソッド、TaskListView/AgendaViewにスキップボタン（⏭）
5. **naturalLanguage.ts 新フィールド対応** — `@`=contexts, `#`=tags, `~YYYY-MM-DD(THH:MM)`=scheduled（callumalpass準拠）。メールアドレス衝突防止のlookbehind付き
6. **README更新** — README.md / README_ja.md をcallumalpass/tasknotes準拠のデータモデル・自然言語書式に更新済み
