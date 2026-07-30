# Quick Start

## 1. Check radiko authentication

認証トークンの状態を確認します:

```bash
tomorrow-radio status
```

## 2. Scan all available stations

全 <kbd>126</kbd> 局をスキャンします:

```bash
tomorrow-radio scan
```

`--source` で特定のソースのみ表示:

| Command | Stations |
|---------|----------|
| `tomorrow-radio scan --source radiko` | 16 局 |
| `tomorrow-radio scan --source rajiru` | 26 局 |
| `tomorrow-radio scan --source simulradio` | 84 局 |

## 3. Launch TUI

トランシーバー風 <kbd>4</kbd> ペイン TUI を起動:

```bash
tomorrow-radio
```

### TUI Controls

| Key | Action |
|-----|--------|
| <kbd>Enter</kbd> | Start / Stop recording |
| <kbd>Tab</kbd> | Focus switch (info ↔ log) |
| <kbd>s</kbd> | Station select dialog (全 126 局) |
| <kbd>m</kbd> | Mode switch (Live / TimeFree) — radiko only |
| <kbd>f</kbd> | Format switch (MP3 / m4a) |
| <kbd>l</kbd> | Show schedule |
| <kbd>q</kbd> / <kbd>Ctrl+C</kbd> | Quit |

## 4. One-shot recording

Station ID はプレフィックスで自動判別されます:

::: code-group

```bash [radiko]
tomorrow-radio live TBS --duration 3600 --format mp3
```

```bash [らじる★らじる]
tomorrow-radio live rajiru_r1_tokyo --duration 1800
```

```bash [サイマルラジオ]
tomorrow-radio live simul_FM_WING --duration 3600
```

:::

## 5. TimeFree (radiko only)

過去の放送を録音します:

```bash
tomorrow-radio tf TBS 20260730130000 20260730140000
```

時刻は `YYYYMMDDHHmm` 形式で指定します。

## 6. Podcast

```bash
# フィード表示
tomorrow-radio podcast feed https://feeds.simplecast.com/54nAGcIl

# エピソードダウンロード
tomorrow-radio podcast download https://feeds.simplecast.com/54nAGcIl 0
```

## 7. Schedule

予約録音を管理します:

| Command | Description |
|---------|-------------|
| `tomorrow-radio schedule add rajiru_r1_tokyo 20260730 1200 3600` | 予約追加 (source 自動判別) |
| `tomorrow-radio schedule list` | 一覧表示 |
| `tomorrow-radio schedule export` | cron 形式で出力 |
