# Quick Start

## 1. Check authentication

```bash
tomorrow-radio status
```

## 2. Scan available stations

```bash
tomorrow-radio scan
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
| s | Station select dialog |
| m | Mode switch (Live / TimeFree) |
| f | Format switch (MP3 / m4a) |
| l | Show schedule |
| q / Ctrl+C | Quit |

## 4. One-shot recording

```bash
# Record 1 hour in MP3
tomorrow-radio live TBS --duration 3600 --format mp3

# TimeFree recording
tomorrow-radio tf TBS 20260730130000 20260730140000
```
