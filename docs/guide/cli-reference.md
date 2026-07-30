# CLI Reference

## Usage

```
tomorrow-radio <command> [options] [arguments]
```

## Commands overview

| Command | Description |
|---------|-------------|
| `tui` | Launch interactive TUI <Badge type="info" text="default" /> |
| `status` | Check radiko authentication status |
| `scan` | List all available stations |
| `epg <station>` | Show program guide |
| `live <station>` | Live recording |
| `tf <station> <ft> <to>` | TimeFree recording <Badge type="warning" text="radiko only" /> |
| `schedule [sub]` | Schedule management |
| `podcast <sub>` | Podcast operations |
| `simulradio <sub>` | SimulRadio operations |
| `rajiru <sub>` | Rajiru★Rajiru operations |

---

## `tui`

Launch the 4-pane transceiver-style TUI. Default when no command is given.

```bash
tomorrow-radio
tomorrow-radio tui --station FMT --format mp3
```

| Option | Default | Description |
|--------|---------|-------------|
| `--station, -s` | `TBS` | Initial station |
| `--format, -f` | `m4a` | Output format (`mp3` / `m4a`) |

---

## `status`

Check radiko authentication. Also validates that auth tokens are cached and valid.

```bash
tomorrow-radio status
```

---

## `scan`

Show all available stations from all sources (126 stations total).

```bash
tomorrow-radio scan
tomorrow-radio scan --source rajiru
```

| Option | Description |
|--------|-------------|
| `--source, -s` | Filter by source: `radiko`, `rajiru`, `simulradio` |

---

## `epg <station>`

Show today's program schedule. Station ID is auto-detected by prefix.

```bash
tomorrow-radio epg TBS                  # radiko
tomorrow-radio epg rajiru_r1_tokyo      # らじる★らじる
```

---

## `live <station>`

Live record from any source. Station ID is auto-detected.

```bash
tomorrow-radio live TBS --duration 1800 --format mp3
tomorrow-radio live rajiru_r1_tokyo
tomorrow-radio live simul_FM_WING 7200
```

| Option | Default | Description |
|--------|---------|-------------|
| `--duration, -d` | `3600` | Recording duration in seconds |
| `--format, -f` | `m4a` | Output format (`mp3` / `m4a`) |

---

## `tf <station> <ft> <to>`

TimeFree recording. <Badge type="warning" text="radiko only" /> (requires authentication).

```bash
tomorrow-radio tf TBS 20260730130000 20260730140000
```

`ft` / `to` format: `YYYYMMDDHHmm`

| Option | Default | Description |
|--------|---------|-------------|
| `--format, -f` | `m4a` | Output format (`mp3` / `m4a`) |

---

## `schedule`

Manage recording schedules using JSON storage at `~/tomorrow-radio/schedule.json`.

```bash
tomorrow-radio schedule list
tomorrow-radio schedule add TBS 20260730 1300 3600 m4a
tomorrow-radio schedule add rajiru_r1_tokyo 20260730 1200 1800
tomorrow-radio schedule remove <id>
tomorrow-radio schedule export
```

**`add` parameters:** `<station> <YYYYMMDD> <HHmm> <duration_sec> [format]`

**`export`** outputs crontab-compatible lines:

```
0 12 30 7 * tomorrow-radio live rajiru_r1_tokyo --duration 1800 --format m4a
```

---

## `podcast`

```bash
tomorrow-radio podcast feed <url>
tomorrow-radio podcast download <url> <episode-index>
```

- Parses RSS 2.0 feeds with `itunes:*` namespace support
- Downloads via ffmpeg (container copy, no re-encode)
- Episodes listed by index from `feed` command

---

## `simulradio`

```bash
tomorrow-radio simulradio scan
tomorrow-radio simulradio live <id> [duration_sec]
```

- Fetches 84 community FM stations from simulradio.info
- Resolves ASX files to HTTP/MMS stream URLs
- `scan` shows station IDs (use with `live`)

---

## `rajiru`

```bash
tomorrow-radio rajiru scan
tomorrow-radio rajiru epg <station-id>
tomorrow-radio rajiru live <id> [duration_sec]
```

- Fetches NHK らじる★らじる config XML (9 areas × 3 services = 26 stations)
- No authentication required
- EPG from NHK API (r8/v8)

---

## Station ID Reference

| Source | Pattern | Example |
|--------|---------|---------|
| radiko | `{ID}` | `TBS`, `FMT`, `QRR` |
| らじる★らじる | `rajiru_{service}_{area}` | `rajiru_r1_tokyo`, `rajiru_fm_osaka` |
| サイマルラジオ | `simul_{name}` | `simul_FM_WING`, `simul_FMくしろ` |

**Services:** `r1`, `r2`, `fm`  
**Areas:** `sapporo`, `sendai`, `tokyo`, `nagoya`, `osaka`, `hiroshima`, `matsuyama`, `fukuoka`, `kumamoto`

## Output Files

All recordings are saved with the pattern `{station}_{YYYYMMDD}_{HHmmss}.{mp3|m4a}`.

Configuration and data files are stored at `~/tomorrow-radio/`:

```
~/tomorrow-radio/
├── config.json        # Settings (auto-created)
├── auth.json          # radiko auth token cache (1 hour TTL)
├── schedule.json      # Schedule entries
└── recordings/        # Output directory
```
