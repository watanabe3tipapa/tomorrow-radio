# Quick Start

## 1. Check radiko authentication

```bash
tomorrow-radio status
```

## 2. Scan all available stations (126局)

```bash
tomorrow-radio scan
```

`--source` で特定のソースのみ表示:

```bash
tomorrow-radio scan --source radiko      # 16局
tomorrow-radio scan --source rajiru      # 26局
tomorrow-radio scan --source simulradio  # 84局
```

## 3. Launch TUI

```bash
tomorrow-radio
```

### TUI Controls

| Key | Action |
|---|---|
| Enter | Start / Stop recording |
| Tab | Focus switch (info ↔ log) |
| s | Station select dialog (全126局) |
| m | Mode switch (Live / TimeFree) — radiko only |
| f | Format switch (MP3 / m4a) |
| l | Show schedule |
| q / Ctrl+C | Quit |

## 4. One-shot recording (source auto-detect)

```bash
# radiko
tomorrow-radio live TBS --duration 3600 --format mp3

# らじる★らじる
tomorrow-radio live rajiru_r1_tokyo --duration 1800

# サイマルラジオ
tomorrow-radio live simul_FM_WING --duration 3600
```

## 5. TimeFree (radiko only)

```bash
tomorrow-radio tf TBS 20260730130000 20260730140000
```

## 6. Podcast

```bash
# フィード表示
tomorrow-radio podcast feed https://feeds.simplecast.com/54nAGcIl

# エピソードダウンロード
tomorrow-radio podcast download https://feeds.simplecast.com/54nAGcIl 0
```

## 7. Schedule

```bash
# 予約追加 (source 自動判別)
tomorrow-radio schedule add rajiru_r1_tokyo 20260730 1200 3600

# 一覧表示
tomorrow-radio schedule list

# cron 形式で出力
tomorrow-radio schedule export
```
