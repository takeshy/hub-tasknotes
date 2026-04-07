# TaskNotes - タスク管理プラグイン for GemiHub

各タスクがYAMLフロントマター付きのMarkdownファイルとして保存される [GemiHub](https://github.com/takeshy/gemihub) プラグインです。データはポータブル — タスクはただのMarkdownファイルなので、あらゆるツールで読み取り、変換、移行が可能です。

[English](README.md)

## 機能

- **4つのビュー** — タスク一覧、カンバンボード、カレンダー（月・週・日）、アジェンダ
- **AIタスク作成** — 自然言語でタスクを記述すると、Gemini/Gemmaが構造化フィールドにパースしてエディタに入力済みで表示
- **タイムトラッキング** — タスクごとの開始/停止タイマー
- **繰り返しタスク** — RRULE形式の繰り返し（毎日・毎週・毎月・毎年）、予定日基準/完了日基準の選択、インスタンスのスキップ
- **計算プロパティ** — 緊急度スコア、期日までの日数、期限超過検出、効率比
- **コンテキスト・タグ・プロジェクト** — `@コンテキスト`、`#タグ`、`+プロジェクト` でタスクをタグ付け・絞り込み
- **依存関係** — タスクエディタで `ブロック元` / `ブロック先` を編集
- **アーカイブ** — 完了タスクをアーカイブ、「アーカイブ済みを表示」フィルタで表示切替
- **予定日時** — 実行予定日時（`scheduled`）とハード期限（`due`）を分離
- **Google Calendar 同期** — タスクをGoogle Calendarに同期、カレンダービューに予定を表示（プレミアムプラン）
- **国際化** — 英語・日本語 UI

## インストール

### GemiHub 設定から

1. GemiHub 設定 > プラグイン タブを開く
2. `takeshy/hub-tasknotes` を入力してインストール
3. プラグインを有効化

### ソースからビルド

```bash
git clone https://github.com/takeshy/hub-tasknotes
cd hub-tasknotes
npm install
npm run build
```

`main.js`、`styles.css`、`manifest.json` が生成されます。

## 使い方

1. インストール後、右サイドバーに **TaskNotes** パネルが表示されます。
2. **AIで作成** をクリックして自然言語でタスクを記述 — Gemini/Gemmaがパースし、エディタに入力済みで表示します。**新しいタスク** で空のエディタも開けます。
3. ビューセレクターで **一覧**、**カンバン**、**カレンダー**、**アジェンダ** を切り替えます。
4. タスクをクリックして詳細を編集 — ステータス、優先度、期日、予定日時、コンテキスト、タグ、プロジェクト、依存関係、繰り返し基準、メモなど。
5. タイマーボタンでタイムトラッキングの開始/停止。
6. 繰り返しタスクでは、スキップボタン（⏭）で今回のインスタンスをスキップし、次の繰り返しに進めます。
7. タスクエディタの **アーカイブ** ボタンで完了タスクをアーカイブ。ツールバーの **アーカイブ済みを表示** で表示/非表示を切り替えます。
8. ツールバーのドロップダウンでステータス、優先度、コンテキスト、タグ、プロジェクトで絞り込み。検索ボックスで自由テキスト検索。タイトル、期日、優先度、緊急度でソート。

### Google Calendar 同期

**プレミアムプラン**（Google Calendar スコープ付き）が必要です。

1. **設定** を開き、**Google Calendar 同期** を有効にします。
2. 期日のあるタスクは、タスクエディタから個別に同期するか、ツールバーのカレンダーボタンで一括同期できます。
3. **カレンダー** ビューでは、Google Calendar の予定が緑色でタスクと一緒に表示されます。
4. 同期済みタスクには Google Calendar で予定を直接開くリンクが表示されます。

### タスクファイル形式

各タスクは設定されたタスクフォルダ内にYAMLフロントマター付きの `.md` ファイルとして保存されます:

```yaml
---
title: 買い物
status: todo
due: "2026-04-10"
scheduled: "2026-04-09T10:00"
priority: medium
contexts: [用事, 自宅]
tags: [食品]
projects: [リフォーム]
timeEstimate: 30
timeEntries: []
recurrence:
  rrule: "FREQ=WEEKLY;INTERVAL=1"
  recurrenceAnchor: scheduled
complete_instances: []
skipped_instances: []
blockedBy: []
blocking: []
archived: false
completedDate: null
createdDate: "2026-04-05T10:00:00Z"
modifiedDate: "2026-04-05T10:00:00Z"
---

- 牛乳
- パン
- 卵
```

> **データモデル** は [callumalpass/tasknotes](https://github.com/callumalpass/tasknotes) に準拠しています。`due` はハード期限（日付のみ）、`scheduled` は実行予定日時、`contexts` はGTDスタイルのコンテキストタグ、`recurrenceAnchor` は次の繰り返しを予定日/期日基準で計算するか完了日基準で計算するかを制御します。

### 自然言語の書式（内部ライブラリ）

`naturalLanguage.ts` モジュールはプログラム的なタスクパースに使用される内部ライブラリです。主要なUI経路はGemini/GemmaによるAIタスク作成です。

| 記法 | 意味 | 例 |
|------|------|-----|
| `@語` | コンテキスト | `@用事` |
| `#語` | タグ | `#食品` |
| `+語` | プロジェクト | `+ショッピング` |
| `!レベル` | 優先度（low/medium/high/urgent） | `!high` |
| `~YYYY-MM-DD` | 予定日 | `~2026-04-09` |
| `~YYYY-MM-DDTHH:MM` | 予定日時 | `~2026-04-09T10:00` |
| `YYYY-MM-DD` | 期日 | `2026-04-15` |
| `明日`, `今日`, `来週月曜` | 相対的な期日 | `明日` |
| `毎日/毎週/毎月/毎年` | 繰り返し | `毎週` |

英語の `tomorrow`, `next Monday`, `every week` なども対応しています。

## 設定

| 設定項目 | 説明 |
|---------|------|
| タスクフォルダ | タスクファイルの保存先フォルダ |
| デフォルトステータス | 新規タスクに設定されるステータス |
| デフォルト優先度 | 新規タスクに設定される優先度 |
| デフォルトビュー | プラグイン起動時に表示するビュー |
| 完了を表示 | 完了・キャンセル済みタスクを表示するか |
| デフォルトカレンダー表示 | 月・週・日 |
| Google Calendar 同期 | タスクをGoogle Calendarに同期（プレミアム） |

## Plugin API の使用

このプラグインは以下の GemiHub Plugin API を使用しています:

- `api.registerView()` — サイドバーパネルの登録
- `api.registerSettingsTab()` — 設定パネルの登録
- `api.gemini.chat()` — Gemini/Gemma LLMによるAIタスク作成
- `api.drive.listFiles/readFile/createFile/updateFile/deleteFile()` — タスクMarkdownファイルのCRUD操作
- `api.storage.get/set()` — プラグイン設定の永続化
- `api.calendar.listEvents/createEvent/updateEvent/deleteEvent()` — Google Calendar 同期（プレミアム）
- `api.onActiveFileChanged()` — メインエディタで開いているタスクファイルの追跡

## 開発

```bash
npm install
npm run dev      # ウォッチモード
npm run build    # プロダクションビルド
npm test         # テスト実行
```

## ライセンス

MIT
