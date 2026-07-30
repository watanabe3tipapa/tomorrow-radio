# DEV-MEMO — Tomorrow Radio

> 本プロジェクトの開発メモ。フェーズごとに追録する。
> UI/UX は [tomorrow-transceiver-socket](https://github.com/watanabe3tipapa/tomorrow-transceiver-socket) のトランシーバー風 TUI (Blessed 4ペイン) を踏襲。

---

## Phase 0 — プロジェクト設計 (2026-07-30)

### 概要

radiko の録音に特化した軽量 CLI ツール。rfriends のような Web サーバ・samba 等の重い依存は一切排除し、
Blessed によるトランシーバー風 TUI で操作する。FFmpeg を子プロセスとして起動し HLS ストリームを録音する。

### 技術スタック — 詳細解説

このプロジェクトは「最小依存・最大実用」を理念に設計されている。
Web サーバ・DB・コンテナなどの重い依存を一切排除し、CLI と TUI のみで動作する。

#### TypeScript + ESM (ECMAScript Modules)

```
tsconfig.json:
  target: ES2022          → async/await, class fields, etc.
  module: ESNext          → 出力コードは import/statement そのまま
  moduleResolution: bundler → .js 拡張子の import を .ts に解決
```

**なぜ TypeScript?** 型安全が命。ラジオの認証トークン・ストリーム URL・番組表データは構造が複雑で、動的型付けだとエッジケースを見落としやすい。特に radiko の API は XML と JSON が混在し、フィールド名も変遷しているため、インターフェースで契約を明示する必要がある。

**なぜ ESM?** 2026年現在、Node.js の標準モジュールシステムは ESM。CommonJS は後方互換性のため残っているが、新規プロジェクトでは ESM が推奨される。`"type": "module"` を package.json に指定し、すべての import に `.js` 拡張子を付ける（TypeScript の `moduleResolution: bundler` が `.js` → `.ts` に透過的に解決する）。

**依存削減の方針**: npm パッケージは必要最小限に抑える。例えば XML パース（radiko EPG・NHK config）や RSS パース（ポッドキャスト）にライブラリを使わず、正規表現ベースの簡易パーサを自作している。これは「軽量」を目的とするだけでなく、API 変更への追従を容易にするためでもある（ライブラリの更新を待たずに自分で直せる）。

---

#### Commander.js — CLI フレームワーク

```
tomorrow-radio <command> [options] [arguments]
```

Node.js の CLI フレームワークでは以下の選択肢がある:

| ライブラリ | 特徴 | 採用判断 |
|---|---|---|
| **Commander.js** | 宣言的 API、サブコマンド・オプション・ヘルプ自動生成 | ✅ 採用 |
| yargs | 豊富な機能、設定が複雑 | 過剰 |
| meow | 軽量だがサブコマンド非対応 | 機能不足 |
| 自前パース | 依存ゼロだが工数大 | 却下 |

Commander.js は `command("epg <station>").option("-f, --format <type>").action(...)` のように直感的に書ける。`--help` の自動生成、エラーメッセージの一元管理、`exitOverride()` によるテスト容易性も評価点。

**デフォルト起動の仕組み**: 既知のコマンド一覧にマッチしない引数で起動された場合、自動的に TUI を起動する。これにより `tomorrow-radio` だけで TUI が立ち上がる。

```typescript
const knownCommands = ["status", "scan", "epg", "live", "tf", "schedule", "podcast", "simulradio", "rajiru", "tui", "help"]
if (isKnown) program.parse(argv)
else startTui(config.defaultStation, config.defaultFormat)
```

---

#### Blessed — TUI (Terminal User Interface)

**Blessed** は Node.js でフルスクリーンのターミナル UI を構築するライブラリ。カーソル操作・色・レイアウト・キーボード入力を ncurses ライクに扱える。

**なぜ Blessed か?**
- React Ink や Vue Termui と違い、フレームワーク依存がない
- `blessed.Container` の階層で絶対配置・相対配置・Percentage 配置が可能
- キーボードイベントを画面全体・要素単位でハンドリングできる
- テキストの色・太字・反転をタグ形式 (`{red-fg}text{/red-fg}`) で記述できる
- スクロール・選択リスト・フォームなどのウィジェットが標準で揃う

**4ペインレイアウトの設計意図**:

```
┌─ SIG ▄▄▄▄▇▇▇█  00:42/60:00  ● REC ─┬─ TBS ─┬─ LIVE ─┬─ m4a ─┐  ← Header (高さ3, 固定)
│ [NOW] 番組名                                   │  ← Main (可変, 番組情報 + チャット)
│ [REC] 録音中...                                │
├──────── Activity Log ───────────────────────────┤  ← Log (可変, イベントログ)
│ [SYS] 認証完了  12:59:30                        │
├─────────────────────────────────────────────────┤
│ [▶ PTT]  Enter:録音  Tab:切替  s:選局  q:終了  │  ← Footer (高さ1, 固定)
└─────────────────────────────────────────────────┘
```

- **Header**: 信号強度バー・経過時間・録音状態・選局中ソース・モード・出力形式を1行で表示。Blessed の `box` に `tags: true` を指定し、色付きテキストをインラインで埋め込んでいる。
- **Main**: 番組情報と録音ステータスを表示するスクロール可能な領域。`height: "100%-7"` のように残りのスペースを動的に埋める。
- **Log**: イベントログ。Blessed の `scrollable` + `alwaysScroll` で自動スクロール。最新30行だけ表示しバッファは500行。
- **Footer**: PTT バー。背景色を青(待機)・赤(録音中)で切り替え、ユーザに状態を直感的に伝える。

**Blessed の欠点と対策**:
- メンテナンスが活発でない → シンプルな API しか使っていないため安定
- TypeScript の型定義が不完全 → `@types/blessed` で対応。一部 `any` キャストが必要
- 日本語表示で文字幅の問題 → `fullUnicode: true` で解決

**トランシーバーのメタファー**: この TUI は物理的なトランシーバー（無線機）の操作感を模倣している。

| トランシーバー | tomorrow-radio |
|---|---|
| 信号強度メーター | 認証状態・接続品質を ▄▄▄▄▇▇▇█ で表示 |
| PTT (Press-To-Talk) ボタン | **Enter** キーで録音開始/停止 |
| 周波数ダイヤル (選局) | **s** キーで放送局選択ダイアログ |
| バンド切替 (AM/FM) | **m** キーで LIVE / タイムフリー切替 |
| スピーカー出力 | 番組情報・録音ステータス表示 |
| アクティビティログ | 認証・録音・エラーの履歴 |

このデザインは [tomorrow-transceiver-socket](https://github.com/watanabe3tipapa/tomorrow-transceiver-socket) から継承している。

---

#### FFmpeg — 録音エンジン

FFmpeg は子プロセスとして起動される。Node.js から `child_process.spawn()` で実行し、標準エラー出力を監視して進捗を取得する。

**なぜ FFmpeg か?**

```
Node.js で HLS を直接デコードする選択肢:
  fluent-ffmpeg      → FFmpeg ラッパー。余計な抽象化が邪魔
  hls.js             → ブラウザ向け。Node.js では非力
  node-media-server  → RTMP サーバ。過剰
  FFmpeg (生 spawn)  → ✅ シンプル。制御しやすい。実績多数
```

FFmpeg は radiko や NHK らじるの録音で豊富な実績があり、HLS・MMS・HTTP ストリームなど多様なプロトコルを1つのバイナリで処理できる。

**録音コマンドの種類**:

```bash
# radiko ライブ録音 → m4a (高速: 再エンコードなし、AACストリームをMP4コンテナに格納)
ffmpeg -http_seekable 0 -seekable 0 \
  -headers "X-Radiko-AuthToken: {token}" \
  -headers "X-Radiko-AreaId: {area}" \
  -user_agent "Mozilla/5.0 ..." \
  -i {m3u8_url} -vn \
  -t {duration} \
  -acodec copy -bsf:a aac_adtstoasc output.m4a

# radiko ライブ録音 → mp3 (再エンコード: AAC → libmp3lame)
ffmpeg ... -acodec libmp3lame -qscale:a 2 output.mp3

# らじる★らじる 録音 (認証不要)
ffmpeg -i {hls_url} -vn -t {duration} -acodec copy -bsf:a aac_adtstoasc output.m4a

# サイマルラジオ 録音
ffmpeg -i {http_or_mms_url} -vn -t {duration} -c copy output.m4a

# ポッドキャスト ダウンロード
ffmpeg -user_agent "Mozilla/5.0" -i {audio_url} -vn -c copy output.mp3
```

**進捗パースの仕組み**:

FFmpeg は標準エラー出力に `time=01:23:45.67` のような経過時間を出力する。`Recorder` クラスは stderr をテキストストリームとして読み、正規表現 `/\btime=(\d+):(\d+):(\d+)\.(\d+)/` でマッチさせて秒数に変換し、`progress` イベントとして emit する。これにより TUI の Header に経過時間をリアルタイム表示できる。

---

#### SourceClient — 統一インターフェース

全ソース（radiko / らじる★らじる / サイマルラジオ）を統一的に扱うための抽象化レイヤー。

```
src/sources/
├── types.ts       # SourceClient インターフェース定義
├── registry.ts    # Station ID prefix から SourceClient を解決
└── adapters.ts    # 各ソースの実装 (RadikoSource, RajiruSource, SimulradioSource)
```

```typescript
interface SourceClient {
  readonly type: "radiko" | "rajiru" | "simulradio"
  getStations(): Promise<Station[]>          // 放送局一覧
  getPrograms(stationId: string): Promise<Program[]>  // 番組表
  getStreamUrl(stationId: string, ...): Promise<string>  // ストリームURL
  buildRecordCommand(streamUrl, outputPath, format, duration?): RecordCommand
  ensureAuth(): Promise<void>               // radiko のみ実装。他は no-op
}
```

**なぜこの抽象化が必要か?** 各ラジオソースは認証方式・API 構造・ストリーム形式がまったく異なる。しかし CLI ユーザから見れば「局を選んで録音する」という操作は共通している。SourceClient はこの差異を吸収し、上位レイヤー（CLI・TUI・スケジューラ）がソースの違いを意識せずに動作できるようにする。

**Station ID による自動ディスパッチ**:

```typescript
function detectSource(id: string): SourceType {
  if (id.startsWith("rajiru_")) return "rajiru"
  if (id.startsWith("simul_")) return "simulradio"
  return "radiko"  // デフォルト
}
```

ユーザは `tomorrow-radio live rajiru_r1_tokyo` のように station ID を指定するだけで、どのソースを使うか自動判別される。`tomorrow-radio live TBS` は従来通り radiko として動作する。

---

#### その他の設計判断

**cron 連携（デーモン不要）**:
rfriends のような常駐サーバは立てない。予約録音は `tomorrow-radio schedule export` で crontab 形式に出力し、OS の cron が時刻になったら CLI を起動する。これにより:
- メモリ消費ゼロ（待機中はプロセスが存在しない）
- システム依存のデーモン管理が不要
- crontab の編集で柔軟なスケジューリングが可能
- 障害時に cron が自動再実行する（オプション次第）

**依存関係の最小化**:
```
プロジェクトの依存 (npm ls --depth=0):
├── blessed        # TUI
├── commander      # CLI
├── typescript     # 型チェック・ビルド
├── @types/blessed # 型定義
├── vitepress      # ドキュメントサイト (devDependency)
└── vue            # ドキュメントサイト (devDependency)
```

たった **3つの実行時依存** で動作する。XML/HTML パース・RSS パース・ネットワーク要求は Node.js 標準の `fetch` と正規表現で行う。これにより:
- `npm install` が一瞬で終わる
- 脆弱性対応が容易（依存が少ないほど監視範囲が狭い）
- どの Node.js バージョンでも安定して動作する

---

## Phase 1 — Radiko 認証エンジン (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `src/radiko/types.ts` | AreaInfo, AuthSession, Station, Program, StreamInfo, RecordMode, OutputFormat |
| `src/radiko/auth.ts` | auth1/auth2 認証フロー + トークンキャッシュ (~/tomorrow-radio/auth.json) |
| `src/radiko/epg.ts` | 放送局一覧・番組表取得 (api.radiko.jp/program/v4) |
| `src/radiko/stream.ts` | m3u8 URL 生成 (live/tf 両対応) + ffmpeg コマンドビルド |
| `src/radiko/client.ts` | RadikoClient 窓口クラス |

### 認証の詳細

- トークンは 1時間キャッシュ (CACHE_TTL_MS = 60min)
- `authenticate(force?)` で強制再認証可能
- エリアIDは radiko.jp/v2/station/area から抽出

### ストリームURL

- Live: `https://f-radiko.smartstream.ne.jp/{station_id}/_definst_/simul-stream.stream/playlist.m3u8?lsid={lsid}&type=b`
- TimeFree: `https://tf-f-rpaa-radiko.smartstream.ne.jp/tf/playlist.m3u8?station_id={station_id}&start_at={ft}&ft={ft}&end_at={to}&to={to}&l=15&lsid={lsid}&type=b`

### ffmpeg コマンド

```
ffmpeg -http_seekable 0 -seekable 0 \
  -headers "X-Radiko-AuthToken: {token}" \
  -headers "X-Radiko-AreaId: {area}" \
  -user_agent "Mozilla/5.0 ..." \
  -i {m3u8_url} -vn \
  [-t {duration}] \
  [-acodec libmp3lame output.mp3 | -acodec copy -bsf:a aac_adtstoasc output.m4a]
```

---

## Phase 2 — 録音エンジン (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `src/recorder/recorder.ts` | Recorder クラス (EventEmitter) |

### Recorder クラス

- `start(options)`: FFmpeg を spawn。stderr から `time=` をパースして進捗イベントを emit。
- `stop()`: SIGTERM → 3秒後 SIGKILL
- `running`: 録音中フラグ
- `elapsedSeconds()`: 経過時間
- イベント: `start`, `done`, `error`, `progress`

### 進捗パース

FFmpeg の stderr 出力から `time=HH:MM:SS.mm` を正規表現で抽出し、秒数に変換して `progress` イベントとして通知。

---

## Phase 3 — CLI サブコマンド (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `src/cli.ts` | Commander.js サブコマンド定義 |
| `src/index.ts` | エントリポイント (#!/usr/bin/env node) |

### サブコマンド一覧

| コマンド | 説明 |
|---|---|
| `tomorrow-radio` | デフォルト: TUI 起動 |
| `status` | 認証状態確認 |
| `scan` | 放送局一覧 |
| `epg <station>` | 番組表表示 |
| `live <station>` | ライブ録音 (ワンショット) |
| `tf <station> <ft> <to>` | タイムフリー録音 |
| `schedule [add/list/remove/export]` | 予約管理 |
| `podcast feed <url>` | ポッドキャストフィード表示 |
| `podcast download <url> <index>` | ポッドキャストエピソードダウンロード |
| `simulradio scan` | サイマルラジオ局一覧 |
| `simulradio live <id>` | サイマルラジオ録音 |
| `tui` | TUI 起動 |

### デフォルト起動制御

transceiver-socket と同じパターン: 既知のコマンドが引数にない場合、自動的に TUI を起動。

```typescript
const knownCommands = ["status", "scan", "epg", "live", "tf", "schedule", "podcast", "simulradio", "tui", "help"]
if (!isKnown) startTui(config.defaultStation, config.defaultFormat)
```

---

## Phase 4 — TUI (Blessed 4ペイン) (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `src/tui/app.ts` | TUI メイン: 4ペインレイアウト・キーバインド・イベントハンドリング |
| `src/tui/signal.ts` | 信号強度バー・経過時間フォーマット |
| `src/tui/station.ts` | 選局ダイアログ (Blessed list) |
| `src/tui/schedule.ts` | 予約一覧表示 |

### レイアウト

```
┌─ SIG ▄▄▄▄▇▇▇█  00:42/60:00  ● REC ─┬─ TBS ─┬─ LIVE ─┬─ m4a ─┐
│ [NOW] 番組名                                   │
│ [REC] 録音中...                                │
├──────── Activity Log ───────────────────────────┤
│ [SYS] 認証完了  12:59:30                        │
├─────────────────────────────────────────────────┤
│ [▶ PTT]  Enter:録音  Tab:切替  s:選局  q:終了  │
└─────────────────────────────────────────────────┘
```

### キーバインド

| キー | 動作 |
|---|---|
| Enter | 録音開始 / 停止 |
| Tab | フォーカス切替 (番組情報 ↔ ログ) |
| s | 選局ダイアログ |
| m | モード切替 (Live / TimeFree) |
| f | 形式切替 (MP3 / m4a) |
| l | 予約一覧表示 |
| q / Ctrl+C | 終了 |

### トランシーバーマッピング

| transceiver-socket → | tomorrow-radio |
|---|---|
| Signal Meter | 受信状態バー |
| PTT | 録音開始/停止 |
| 選局 (Model) | 放送局選択 |
| Band 切替 | Live/TimeFree |
| Chat エリア | 番組情報・録音ステータス |
| Activity Log | アクティビティログ |

---

## Phase 5 — スケジューラ (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `src/scheduler/store.ts` | ScheduleEntry の CRUD (JSON 永続化) |
| `src/scheduler/scheduler.ts` | Scheduler クラス: 予約管理 + crontab エクスポート |

### データ保存

`~/tomorrow-radio/schedule.json` に保存。

```json
[
  {
    "id": "TBS_202607301300_1234567890",
    "station": "TBS",
    "start": "202607301300",
    "duration": 3600,
    "format": "m4a",
    "enabled": true
  }
]
```

### cron エクスポート

```bash
tomorrow-radio schedule export
# → 0 12 30 7 * tomorrow-radio live TBS --duration 3600 --format m4a
```

ツールは常駐せず、cron が予約時刻に CLI を起動する設計。

---

## Phase 6 — VitePress ドキュメントサイト (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `docs/index.md` | トップページ (hero + features + TuiDemo) |
| `docs/components/TuiDemo.vue` | 動く TUI モック (録音デモアニメーション) |
| `docs/guide/installation.md` | インストール手順 |
| `docs/guide/quickstart.md` | クイックスタート |
| `docs/guide/cli-reference.md` | CLI リファレンス |
| `docs/.vitepress/config.ts` | VitePress 設定 |
| `.github/workflows/deploy.yml` | GitHub Pages 自動デプロイ |

### TuiDemo.vue

transceiver-socket の TuiDemo.vue をベースに、radiko 録音用にカスタマイズ:
- 信号バー + 経過時間 + 録音インジケータ
- 選局アニメーション (TBS → FMT)
- モード切替 (Live → TimeFree)
- 形式切替 (m4a → mp3 → m4a)
- 録音開始 → 進捗 → 完了の一連の流れ

### デプロイ

main ブランチに push すると GitHub Actions が自動で GitHub Pages にデプロイ。
`https://watanabe3tipapa.github.io/tomorrow-radio/` で公開。

---

## 豆知識コーナー

### radiko API の変遷

| 年代 | エリアAPI | EPG API | ストリーム |
|---|---|---|---|
| ~2024 | `/v2/station/area` (HTML) | `/program/v4/date/{d}/area/{area}.json` | `radiko.jp/v2/api/ts/playlist.m3u8` |
| 2025~ | `/apparea/area` (JS) | `/v3/program/station/date/{d}/{id}.xml` | `f-radiko.smartstream.ne.jp/...` |
| 2026-01 | 同上 | 同上 | `tf-f-rpaa-radiko.smartstream.ne.jp/tf/playlist.m3u8` |

- 旧 v4 JSON 系の EPG API は 2025 年頃に廃止され、現在は XML ベースの v3 のみ動作
- ストリーム URL は 2026-01 にタイムフリーのエンドポイントが変更された（`radiko.jp/v2/api/ts/...` → `tf-f-rpaa-radiko.smartstream.ne.jp/...`）
- エリア判定も変遷しており、`/v2/station/area` は 404 を返すため `api.radiko.jp/apparea/area` を使う必要がある

### 放送局のエリア判定の仕組み

radiko の認証は **2段階認証** で動作する:

1. **Auth1**: クライアント情報（端末・アプリバージョン）を送ると、サーバがトークンと鍵オフセットを返す
2. **Auth2**: トークン + playerCommon.js から計算した部分鍵を送ると、現在のエリアが判定される

エリア判定は **接続元IPアドレスベース**。ストリーミング CDN (`smartstream.ne.jp`) も同じく IP ベースでアクセス制御を行っており、日本国外の IP からは接続できない。
Auth1/Auth2 サーバは国外からでも比較的寛容だが、ストリーム配信サーバは厳密にブロックする。
そのため「認証は通るが録音はできない」という状態が発生しうる。

### XML パースの注意点

radiko の XML は属性と要素が混在する非標準的な構造を持つ。

```xml
<prog id="13670438" ft="20260730050000" to="20260730063000">
  <title>番組名</title>
  <pfm>パーソナリティ名</pfm>
  <img>https://...</img>
  <metas>
    <meta name="twitter" value="#radiko" />
  </metas>
</prog>
```

- 開始時刻・終了時刻は `<prog>` タグの属性（`ft`, `to`）
- 番組名・パーソナリティは子要素
- Node.js には標準の DOM パーサがないため、正規ベースの簡易パーサで対応した
- 属性は開始タグ内から、要素内容はタグ間から別々に抽出する必要がある

### radiko ストリームの仕様

- コーデック: **AAC-LC** (48kHz, 48kbps 程度)
- プロトコル: **HLS** (HTTP Live Streaming)
- ライブ遅延: 約 85 秒（放送波に対して）
- タイムフリー: 放送終了後から 1 週間以内の番組が視聴可能
- 録音時の FFmpeg オプション:
  - `-http_seekable 0 -seekable 0` — HLS のシーク不可ストリームに対応
  - `-acodec copy -bsf:a aac_adtstoasc` — AAC を MP4 コンテナに格納 (m4a)
  - `-acodec libmp3lame` — MP3 にトランスコード
  - `-headers` で認証トークンを渡す（X-Radiko-AuthToken, X-Radiko-AreaId）

### その他のラジオストリーミング API

| サービス | 認証 | プロトコル | 特記事項 |
|---|---|---|---|
| radiko | auth1+auth2 + IP制限 | HLS (AAC) | 日本国外ブロック |
| らじる★らじる (NHK) | なし (Geolockのみ) | HLS (AAC) | 日本国外ブロック |
| ListenRadio | なし | HLS (MP3) | radiko 非参加局向け |
| FM++ | なし | HLS | コミュニティFM |

- NHK のらじる★らじるは認証不要だが、radiko と同様に日本国外ブロックあり
- listenradio は認証なしかつ比較的制限が緩いが、対応局は限られる

---

## Phase 7 — ポッドキャスト対応 (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `src/podcast/types.ts` | PodcastFeed, PodcastEpisode 型定義 |
| `src/podcast/feed.ts` | RSS 2.0 フィードパーサ + ダウンロードコマンド生成 |
| `src/podcast/client.ts` | PodcastClient 窓口クラス |

### 対応フォーマット

- **RSS 2.0**: `<enclosure>` タグから音声ファイル URL を抽出
- **iTunes 名前空間**: `itunes:duration`, `itunes:author`, `itunes:image` に対応
- **media:content**: フォールバックとして `media:content` も対応
- **CDATA**: `<!CDATA[...]>` を適切にパース
- ffmpeg で直接ダウンロード (コンテナコピー、再エンコードなし)

### CLI サブコマンド

```
tomorrow-radio podcast feed <url>
tomorrow-radio podcast download <url> <episode-index>
```

### 制限

- RSS 2.0 のみ対応 (Atom フィード非対応)
- ダウンロードのみ (ストリーミング再生は非対応)
- スケジュール録音は未対応 (cron export の範囲外)

---

## Phase 8 — サイマルラジオ対応 (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `src/simulradio/types.ts` | SimulStation 型定義 |
| `src/simulradio/client.ts` | 局一覧スクレイピング + ASX ストリーム解決 |

### simulradio.info の HTML 構造

```html
<h2><a name="hokkaido" id="hokkaido"></a>北海道</h2>
<table>...
  <tr>    ← 画像行
    <td><img src="data/3.jpg" /></td>
    <td><a href="https://www.simulradio.info/asx/fmwing.asx"><img src="images/btn_radio.jpg" /></a></td>
  </tr>
  <tr>    ← 局名行
    <td colspan="2"><strong><a href="http://www.fmwing.com/">FM WING</a></strong><br />...</td>
  </tr>
</table>
```

- 局名は `<strong><a>局名</a></strong>` で次の tr 行にある
- ASX リンクは画像行の `<a href="...asx">` にある
- 行単位パース: ASX リンク行を見つけたら、次の 10 行以内で局名を探す

### ASX ファイルの構造

```xml
<Asx Version="3.0">
  <Entry>
    <Title>FM IWAKI</Title>
    <ref href="http://hdv2.nkansai.tv/seawave"/>
    <ref href="mms://hdv2.nkansai.tv/seawave"/>
  </Entry>
</Asx>
```

- HTTP URL を優先、MMS をフォールバック
- FFmpeg で MMS/HTTP ストリームを録音

### CLI サブコマンド

```
tomorrow-radio simulradio scan              # 84局一覧表示
tomorrow-radio simulradio live <id> [sec]   # 局 ID 指定で録音
```

### 注意点

- サイマルラジオ対応全般
  - simulradio.info の HTML は手動メンテの静的な table レイアウト
  - 局の追加・削除は HTML 構造に依存するため、将来のレイアウト変更でパースが壊れる可能性あり
  - 地域別カテゴリ: 北海道(18), 東北(5), 関東甲信越(18), 近畿(6), 中国(13), 四国(8), 九州(15), 沖縄(1)

- ストリーム形式
  - ASX ファイルは Windows Media のメタファイル形式
  - HTTP または MMS (Windows Media Streaming) で配信
  - 一部の局は ListenRadio (HLS, MP3) にも対応しているが、本実装では ASX のみサポート
  - コミュニティ FM のため配信品質は安定しない場合がある

---

## Phase 9 — らじる★らじる対応 (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `src/rajiru/types.ts` | RajiruConfig, RajiruStation, RajiruProgram 型定義 |
| `src/rajiru/client.ts` | config XML パース + HLS URL + 番組表API |

### NHK らじる★らじる API 構造

```xml
<radiru_config>
  <stream_url>
    <data>
      <areajp>東京</areajp>
      <area>tokyo</area>
      <apikey>001</apikey>
      <areakey>130</areakey>
      <r1hls><![CDATA[https://simul.drdi.st.nhk/live/3/joined/master.m3u8]]></r1hls>
      <r2hls><![CDATA[https://simul.drdi.st.nhk/live/4/joined/master.m3u8]]></r2hls>
      <fmhls><![CDATA[https://simul.drdi.st.nhk/live/5/joined/master.m3u8]]></fmhls>
    </data>
  </stream_url>
  <url_program_noa><![CDATA[//api.nhk.jp/r8/pg/now/radio/{area}/now.json]]></url_program_noa>
  <url_program_day><![CDATA[//api.nhk.jp/r8/pg/date/{service}/{area}/[YYYY-MM-DD].json]]></url_program_day>
</radiru_config>
```

- Config XML は `https://www.nhk.or.jp/radio/config/config_web.xml`
- 2025年9月に stream URL が `radio-stream.nhk.jp` → `simul.drdi.st.nhk` に変更
- R2 は全国共通 (stream ID 4)、R1・FM は地域ごとに異なる
- 番組表 API は `r8` 系 (v8)、`r7` から更新されている
- 9地域: 札幌(010)、仙台(040)、東京(130)、名古屋(230)、大阪(270)、広島(340)、松山(380)、福岡(400)、熊本(430)

### 認証

- 認証不要 (radiko のような auth1/auth2 は存在しない)
- 日本国外からのアクセスは地理的制限でブロックされる
- ストリーム CDN も IP ベースの制限あり

### 番組表データ構造

```json
{
  "r1": {
    "publication": [
      {
        "id": "r1-130-2026073074781",
        "name": "番組名",
        "description": "番組詳細",
        "startDate": "2026-07-30T05:00:03+09:00",
        "endDate": "2026-07-30T05:55:00+09:00"
      }
    ]
  }
}
```

- 72 件/日の番組データ (R1 東京の場合)
- `startDate` / `endDate` は ISO 8601 形式 (+09:00)

---

## Phase 10 — 統一 SourceClient インターフェース (2026-07-30)

### 実装ファイル

| ファイル | 責務 |
|---|---|
| `src/sources/types.ts` | SourceClient, Station, Program, RecordCommand 統一型定義 |
| `src/sources/registry.ts` | ソース種別検出 (detectSource) + シングルトン管理 |
| `src/sources/adapters.ts` | RadikoSource / RajiruSource / SimulradioSource 実装 |

### SourceClient インターフェース

```typescript
interface SourceClient {
  readonly type: SourceType  // "radiko" | "rajiru" | "simulradio"
  getStations(): Promise<Station[]>
  getPrograms(stationId: string): Promise<Program[]>
  getStreamUrl(stationId: string, mode?: string, ft?: string, to?: string): Promise<string>
  buildRecordCommand(streamUrl: string, outputPath: string, format: string, duration?: number): RecordCommand
  ensureAuth(): Promise<void>
}
```

### Station ID の設計

| 種別 | パターン | 例 |
|---|---|---|
| radiko | `{ID}` (大文字) | `TBS`, `FMT` |
| らじる★らじる | `rajiru_{service}_{area}` | `rajiru_r1_tokyo` |
| サイマルラジオ | `simul_{name_slug}` | `simul_FM_WING` |

`detectSource(id)` が prefix で自動判別:
- `rajiru_` → RajiruSource
- `simul_` → SimulradioSource
- それ以外 → RadikoSource

### CLI の unified 化

```
tomorrow-radio epg TBS                   → radiko
tomorrow-radio epg rajiru_r1_tokyo       → rajiru (自動判別)
tomorrow-radio live simul_FM_WING        → simulradio (自動判別)
tomorrow-radio scan                      → 全ソース一覧
tomorrow-radio scan --source rajiru      → rajiru のみ
```

### 今後の課題

- ポッドキャストの SourceClient 統合 (RSS はストリーミングと性質が異なるため要検討。ダウンロード完了の検知・進捗表示を TUI で行えると理想的)
- TUI での EPG 表示精査 (現在は現在放送中のみ。全日番組表のスクロール表示があれば便利)
- スケジューラの podcast 対応 (cron export の範囲外。podcast は定期チェック + 新着ダウンロードという別の仕組みが必要)
