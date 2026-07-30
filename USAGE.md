# USAGE — Tomorrow Radio

軽量 radiko / らじる★らじる / サイマルラジオ / ポッドキャスト 録音 CLI。Blessed TUI のトランシーバー風インターフェースで操作する。

---

## セットアップ

### 依存

- Node.js 22+
- FFmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg
```

### インストール

```bash
git clone https://github.com/watanabe3tipapa/tomorrow-radio.git
cd tomorrow-radio
npm install
npm run build
npm link    # グローバルインストール
```

---

## CLI コマンド

```
tomorrow-radio                                    # TUI 起動 (デフォルト)
tomorrow-radio status                             # 認証確認
tomorrow-radio scan                               # 全ソースの放送局一覧
tomorrow-radio scan --source radiko               # radiko のみ
tomorrow-radio epg TBS                            # radiko 番組表
tomorrow-radio epg rajiru_r1_tokyo                # らじる★らじる番組表
tomorrow-radio live TBS                           # radiko ライブ録音
tomorrow-radio live rajiru_r1_tokyo               # らじる★らじる録音
tomorrow-radio live simul_FM_WING                 # サイマルラジオ録音
tomorrow-radio tf TBS 20260730130000 20260730140000  # タイムフリー (radiko のみ)
tomorrow-radio schedule                           # 予約一覧
tomorrow-radio schedule add TBS 20260730 1300 3600 m4a  # 予約追加
tomorrow-radio schedule remove <id>               # 予約削除
tomorrow-radio schedule export                    # cron 形式で出力
tomorrow-radio podcast feed <url>                 # ポッドキャストフィード表示
tomorrow-radio podcast download <url> <index>     # ポッドキャストエピソードダウンロード
tomorrow-radio simulradio scan                    # サイマルラジオ局一覧
tomorrow-radio simulradio live <id> [duration]    # サイマルラジオ録音
tomorrow-radio rajiru scan                        # らじる★らじる局一覧
tomorrow-radio rajiru epg <id>                    # らじる★らじる番組表
tomorrow-radio rajiru live <id> [duration]        # らじる★らじる録音
```

### オプション

```
tomorrow-radio live TBS --duration 1800 --format mp3
tomorrow-radio tui --station FMT --format m4a
tomorrow-radio simulradio live simul_FM_WING 1800
```

| オプション | 対象 | 説明 | デフォルト |
|---|---|---|---|
| `--duration, -d` | live, simulradio live | 録音時間(秒) | 3600 |
| `--format, -f` | live, tf, tui | 出力形式 | m4a |
| `--station, -s` | tui | 初期選局 | TBS |

---

## TUI 操作

```
┌─ SIG ▄▄▄▄▇▇▇█  00:42/60:00  ● REC ─┬─ TBS ─┬─ LIVE ─┬─ m4a ─┐
│ [NOW] 伊集院光の週末ラジオ                      │
│ [REC] 録音開始 → TBS_20260730_130000.m4a        │
├──────── Activity Log ────────────────────────────┤
│ [SYS] 認証完了 エリア:JP13  12:59:30            │
│ [REC] 録音開始: TBS (LIVE)  13:00:00            │
├──────────────────────────────────────────────────┤
│ [▶ PTT]  Enter:録音  Tab:切替  s:選局  q:終了  │
└──────────────────────────────────────────────────┘
```

### キーバインド

| キー | 動作 |
|---|---|
| **Enter** | 録音開始 / 停止 (PTT) |
| **Tab** | フォーカス切替 (番組情報 ↔ ログ) |
| **s** | 選局ダイアログ |
| **m** | モード切替 (Live / TimeFree) |
| **f** | 形式切替 (MP3 / m4a) |
| **l** | 予約一覧表示 |
| **q** / **Ctrl+C** | 終了 |

### ステータス表示

| ヘッダー要素 | 説明 |
|---|---|
| SIG ▄▄▄▄▇▇▇█ | 信号強度バー (認証状態・接続品質) |
| 00:42/60:00 | 録音経過時間 / 最大時間 |
| ● REC | 録音中 (赤) / 接続済み (緑) / OFF (赤) |
| TBS | 現在の放送局 |
| LIVE / TIMEFREE | 動作モード |
| m4a / mp3 | 出力形式 |

---

## 出力ファイル

```
~/tomorrow-radio/
├── config.json          # 設定 (自動生成)
├── auth.json            # 認証トークンキャッシュ (1時間有効)
├── schedule.json        # 予約一覧 (手動編集可)
└── recordings/          # 録音ファイル出力先 (設定変更可)
    ├── TBS_20260730_130000.m4a
    └── FMT_20260730_140000.mp3
```

### 録音ファイル名の形式

```
{放送局ID}_{YYYYMMDD}_{HHmmss}.{mp3|m4a}
例: TBS_20260730_130000.m4a
```

---

## スケジュール録音 (cron)

ツールは常駐しません。以下の手順で cron に登録します。

```bash
# 予約を追加
tomorrow-radio schedule add TBS 20260730 1300 3600 m4a

# cron 形式で出力
tomorrow-radio schedule export
# → 0 13 30 7 * tomorrow-radio live TBS --duration 3600 --format m4a

# crontab に追記
crontab -e
# 上記の行をペースト
```

または手動で直接 crontab に書く:

```
# 毎週月曜 13:00 から 1時間 TBS を録音
0 13 * * 1 /usr/local/bin/tomorrow-radio live TBS --duration 3600 --format m4a >> ~/tomorrow-radio/cron.log 2>&1
```

---

## 対応ソース

| ソース | 局数 | 認証 | プロトコル | 番組表 | タイムフリー |
|---|---|---|---|---|---|
| radiko | 16 (東京) | auth1+auth2 + IP制限 | HLS (AAC) | ✅ | ✅ |
| らじる★らじる | 26 (9地域×3サービス) | 不要 (Geolockのみ) | HLS (AAC) | ✅ | ❌ |
| サイマルラジオ | 84 (全国コミュニティFM) | 不要 | ASX→HTTP/MMS | ❌ | ❌ |
| ポッドキャスト | 任意 | 不要 | RSS→音声ファイル | N/A | N/A |

Station ID の prefix で自動判別: `rajiru_` → らじる★らじる、`simul_` → サイマルラジオ、それ以外 → radiko

### radiko 認証の仕組み

```
① GET /v2/station/area         → エリアID (例: JP13)
② GET /v2/api/auth1            → x-radiko-authtoken, x-radiko-keyoffset
③ GET /apps/js/playerCommon.js → 認証キー抽出 → partial key 生成
④ GET /v2/api/auth2            → 認証確立
⑤ m3u8 URL を解決 → FFmpeg で録音
```

- 認証トークンは `~/tomorrow-radio/auth.json` にキャッシュ (1時間)
- キャッシュが切れたら自動再認証
- らじる★らじる・サイマルラジオは認証不要

---

## アーキテクチャ

```
src/
├── index.ts              # エントリポイント
├── cli.ts                # Commander サブコマンド (source 抽象化)
├── transceiver.ts        # イベント駆動の中心クラス
├── sources/
│   ├── types.ts          # 統一 SourceClient インターフェース (Station, Program, RecordCommand)
│   ├── registry.ts       # ソース種別検出 + インスタンス管理
│   └── adapters.ts       # RadikoSource / RajiruSource / SimulradioSource
├── radiko/
│   ├── types.ts          # 型定義
│   ├── auth.ts           # 認証
│   ├── epg.ts            # EPG 取得
│   ├── stream.ts         # ストリームURL解決 + ffmpeg コマンド生成
│   └── client.ts         # 窓口クラス
├── rajiru/
│   ├── types.ts          # 型定義 (RajiruConfig, RajiruStation, RajiruProgram)
│   └── client.ts         # config XML パース + HLS URL + 番組表API
├── podcast/
│   ├── types.ts          # 型定義 (PodcastFeed, PodcastEpisode)
│   ├── feed.ts           # RSS フィードパーサ + ダウンロードコマンド生成
│   └── client.ts         # PodcastClient 窓口クラス
├── simulradio/
│   ├── types.ts          # 型定義 (SimulStation)
│   └── client.ts         # サイマルラジオ局一覧取得 + ASX ストリーム解決
├── recorder/
│   └── recorder.ts       # FFmpeg 子プロセス管理
├── scheduler/
│   ├── store.ts          # 予約 JSON 永続化
│   └── scheduler.ts      # 予約管理
├── tui/
│   ├── app.ts            # Blessed 4ペイン
│   ├── signal.ts         # 信号強度バー
│   ├── station.ts        # 選局ダイアログ
│   └── schedule.ts       # 予約表示
└── utils/
    └── config.ts         # 設定管理
```

---

## 開発

```bash
npm run dev          # tsc --watch
npm run build        # tsc
npm run typecheck    # tsc --noEmit
npm start            # node dist/index.js
```

### VitePress サイト

```bash
npm run docs:dev     # http://localhost:5173/tomorrow-radio/
npm run docs:build   # 静的ビルド
npm run docs:preview # ビルド結果のプレビュー
```

### GitHub Pages 公開

main ブランチに push すると `.github/workflows/deploy.yml` が自動デプロイ。
`https://watanabe3tipapa.github.io/tomorrow-radio/` で公開。

---

## トラブルシューティング

### 認証エラー

```
tomorrow-radio status  # 認証状態確認
rm ~/tomorrow-radio/auth.json  # キャッシュ削除して再試行
tomorrow-radio status
```

### FFmpeg がない

```bash
# macOS
brew install ffmpeg
# Ubuntu
sudo apt install ffmpeg
```

### ストリームに接続できない (Operation timed out)

radiko のストリーミング CDN は **日本国外の IP アドレスをブロック** します。
認証 (auth1/auth2) は通っても、録音は日本国内のネットワークからしか行えません。

対策:
- 日本国内の VPS や自宅サーバで実行する
- 日本国内に出口のある VPN を使用する

### 録音が途中で止まる

長時間録音の場合、FFmpeg の再接続が必要な場合があります。`-reconnect` オプションを stream.ts の `buildRecordCommand` に追加してください。
