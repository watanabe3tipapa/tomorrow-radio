# CLI Reference

## `tomorrow-radio`

Default: launch TUI.

## `tomorrow-radio status`

Check authentication status.

## `tomorrow-radio scan`

List available radio stations.

## `tomorrow-radio epg <station>`

Show program schedule for a station.

```bash
tomorrow-radio epg TBS
```

## `tomorrow-radio live <station>`

Record a live stream.

| Option | Description | Default |
|---|---|---|
| `-d, --duration <sec>` | Recording duration | 3600 |
| `-f, --format <format>` | Output format (mp3/m4a) | m4a |

```bash
tomorrow-radio live TBS --duration 1800 --format mp3
```

## `tomorrow-radio tf <station> <ft> <to>`

Record a TimeFree program.

```bash
tomorrow-radio tf TBS 20260730130000 20260730140000 --format m4a
```

## `tomorrow-radio schedule`

Manage recording schedule.

```bash
# List
tomorrow-radio schedule list

# Add
tomorrow-radio schedule add TBS 20260730 1300 3600 m4a

# Remove
tomorrow-radio schedule remove <id>

# Export cron format
tomorrow-radio schedule export
```

## `tomorrow-radio tui`

Launch TUI (same as default).

| Option | Description |
|---|---|
| `-s, --station <id>` | Initial station |
| `-f, --format <format>` | Output format |
