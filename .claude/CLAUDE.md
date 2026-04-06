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

## 未実装項目

下記は型・シリアライザ・ストアには実装済みだがUI/ロジックが不足している:

### 1. recurrenceAnchor切替UI
- **現状**: TaskEditorで���り返し設定時、`recurrenceAnchor`は常に`"scheduled"`固定
- **必要な作業**: TaskEditorの繰り返しセクションにドロップダウンまたはトグルを追加。"scheduled"（期日/予定日基準）と"completion"（完了日基準）を選択可能にする
- **関連ファイル**: `src/ui/TaskEditor.tsx` (handleRecurrenceChange付近)
- **i18n**: キーは削除済み（旧recurrenceFlexible/recurrenceFixed）。新しいキー（例: `recurrenceAnchorScheduled`, `recurrenceAnchorCompletion`）をi18n.tsに追加する必要あり

### 2. blockedBy / blocking 編集UI
- **現状**: `blockedBy: string[]` と `blocking: string[]` は型・��リアライザで対応済みだがTaskEditorにUI無し
- **必要な作業**: TaskEditorにタスクID入力欄を追加。理想的にはタスク一覧からの検索・選択UIだが、まずはコンマ区切りテキスト入力で良い
- **関連ファイル**: `src/ui/TaskEditor.tsx`
- **i18n**: `blockedBy`, `blocking` キーは既に存在

### 3. archived 操作UI
- **現状**: `archived: boolean`フィールドは型・シリアライザ・フィルタ(`hideArchived`)で対応済み。だがアーカイブする操作UIが無い
- **必要な作業**:
  - TaskEditorまたはタスク行のコンテキストメニューに「アーカイブ」ボタン追加
  - フィルタUIに「アーカイブ済みを表示」トグル追加（`hideArchived`）
  - （任意）callumalpass/tasknotes同様の自動アーカイブ（完了後N分で自動的にarchived=trueにする設定）
- **関連ファイル**: `src/ui/TaskPanel.tsx`, `src/ui/TaskEditor.tsx`, `src/ui/SettingsPanel.tsx`
- **i18n**: `archived` キーは既に存在

### 4. skipped_instances UI
- **現状**: `skipped_instances: string[]`はシリアライズ対応済みだが、繰り返しタスクのインスタンスをスキップする操作UIが無い
- **必要な作業**: 繰り返しタスクの完了ボタン長押し or 右クリックで「スキップ」オプションを追加。スキップ時は`skipped_instances`に日付を追加し、次の繰り返しに進む
- **関連ファイル**: `src/core/taskService.ts` (skip操作メソッド追加), `src/ui/TaskListView.tsx` or `TaskPanel.tsx`

### 5. naturalLanguage.ts の新フィールド対応
- **現状**: `#`はcontextsにマップ。`scheduled`, `tags`, `blockedBy`/`blocking`は未パース
- **注意**: quick createはAI経由に変更済みなのでnaturalLanguage.tsは直接UIから呼ばれない。テストとライブラリ利用のみ。優先度低
- **必要な作業**: 新しいトリガー文字の検討（例: tagsは`#`、contextsは`@`にするなど callumalpass準拠）

### 6. README更新
- callumalpass/tasknotes準拠へのリファクタ内容（フィールド名変更、scheduled追加等）をREADME/README_jaに反映する必要あり
