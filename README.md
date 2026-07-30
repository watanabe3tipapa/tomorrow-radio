# Tomorrow Radio

軽量 CLI で radiko / らじる★らじる / サイマルラジオ / ポッドキャスト を録音するツール。
Blessed のトランシーバー風 TUI で操作する。

<img src="./assets/UC900.png" alt="Tomorrow Radio TUI" width="720">

## Features

- **Multi-Source**: radiko (16局) + らじる★らじる (26局) + サイマルラジオ (84局) + 任意ポッドキャスト
- **Station ID Auto-Detect**: `tomorrow-radio live rajiru_r1_tokyo` で自動判別
- **Signal Meter TUI**: 4ペインのトランシーバー風インターフェース
- **PTT Record**: Enter 一発で録音開始/停止
- **TimeFree**: radiko タイムフリー録音対応
- **cron Scheduling**: 常駐デーモン不要、cron エクスポート
- **Lightweight**: 依存は blessed + commander の 2 パッケージのみ

## Quick Start

```bash
npm install -g tomorrow-radio

tomorrow-radio status                    # 認証確認
tomorrow-radio scan                      # 全126局一覧
tomorrow-radio                           # TUI 起動
tomorrow-radio live TBS                  # radiko 録音
tomorrow-radio live rajiru_r1_tokyo      # らじる★らじる録音
tomorrow-radio live simul_FM_WING        # サイマルラジオ録音
tomorrow-radio podcast feed <url>        # ポッドキャスト
```

## Documentation

- [Installation](https://watanabe3tipapa.github.io/tomorrow-radio/guide/installation)
- [Quick Start](https://watanabe3tipapa.github.io/tomorrow-radio/guide/quickstart)
- [CLI Reference](https://watanabe3tipapa.github.io/tomorrow-radio/guide/cli-reference)

## License

MIT
