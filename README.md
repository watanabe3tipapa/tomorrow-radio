# Tomorrow Radio

[![Version](https://img.shields.io/badge/version-v0.2.3-00a9c6?style=flat-square)](https://github.com/watanabe3tipapa/tomorrow-radio)
[![Deploy VitePress site](https://github.com/watanabe3tipapa/tomorrow-radio/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/watanabe3tipapa/tomorrow-radio/actions/workflows/deploy.yml)
[![Node.js](https://img.shields.io/badge/node.js-22%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-f0a51a?style=flat-square)](https://github.com/watanabe3tipapa/tomorrow-radio#license)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-007f9a?style=flat-square)](https://watanabe3tipapa.github.io/tomorrow-radio/)

**Tomorrow Radio** は、radiko、らじる★らじる、サイマルラジオ、ポッドキャストを1つの操作体系で扱う軽量な録音CLIです。Blessedによるトランシーバー風TUIで、放送局の選択から録音開始・停止、予約録音までをターミナル上で完結できます。

<img src="./assets/UC900.png" alt="Tomorrow Radio TUIの画面。信号メーター、局情報、ログ、録音状態を表示している。" width="720">

## v0.2.3

v0.2.3では、Radikoの認証済みHLS録音を安定させ、TUIから停止した録音ファイルが安全に確定されるよう改善しました。あわせて、GitHub Pagesのドキュメントサイトを受信機／電波のコンセプトで再設計し、視覚的な階層とモバイルでの読みやすさを高めています。

| 改善項目 | 内容 |
| --- | --- |
| **Radiko録音の修正** | FFmpegへ渡す認証ヘッダをCRLF区切りの単一ブロックに統一し、認証トークンが失われる問題を解消しました。 |
| **エリア判定の改善** | `auth2` の応答から配信エリアを取得し、対象地域外の状態を認証成功として扱わないようにしました。 |
| **安全な停止処理** | TUIからの停止時にFFmpegへ終了指示を送り、m4aのメタデータを確定してから終了します。 |
| **ドキュメントUI** | ヒーロー、CTA、機能カード、TUIデモ、コードブロック、表をトランシーバーの世界観で統一しました。 |

> Radikoは配信エリアやサービス側の仕様により利用可否が変わります。対象地域外の場合は、録音開始前に明確なエラーを表示します。

## Features

| 機能 | 概要 |
| --- | --- |
| **Multi-Source** | radiko、らじる★らじる、サイマルラジオ、任意のポッドキャストを扱えます。 |
| **Station ID Auto-Detect** | `tomorrow-radio live rajiru_r1_tokyo` のように局IDから配信元を自動判別します。 |
| **Signal Meter TUI** | 信号メーター、番組情報、ログ、ステータスを4ペインの受信機風UIで表示します。 |
| **PTT Record** | `Enter` キー1つで録音を開始・停止できます。 |
| **TimeFree** | radikoのタイムフリー録音に対応します。 |
| **cron Scheduling** | 常駐プロセスを必要とせず、cron形式へ予約録音をエクスポートできます。 |
| **Lightweight** | 実行時の主な依存はBlessedとCommanderで、録音処理にはFFmpegを使用します。 |

## Requirements

| 要件 | バージョン・用途 |
| --- | --- |
| Node.js | **22以上**。CLIおよびドキュメントサイトの実行・ビルドに使用します。 |
| FFmpeg | ライブ配信、タイムフリー、ポッドキャストの録音・保存に使用します。 |

## Quick Start

インストール後、次のコマンドで認証確認、局の検索、TUIの起動、各配信元の録音を行えます。

```bash
# 認証確認（radiko）
tomorrow-radio status

# 対応局を一覧表示
tomorrow-radio scan

# トランシーバー風TUIを起動
tomorrow-radio

# radikoを録音
tomorrow-radio live TBS --duration 1800

# らじる★らじるを録音（配信元を自動判別）
tomorrow-radio live rajiru_r1_tokyo --duration 1800

# サイマルラジオを録音
tomorrow-radio live simul_FM_WING --duration 3600

# ポッドキャストのフィードを取得
tomorrow-radio podcast feed <url>
```

## Documentation

詳しい導入方法、最初の録音、全コマンドはドキュメントサイトで確認できます。

| 内容 | リンク |
| --- | --- |
| インストール | [Installation](https://watanabe3tipapa.github.io/tomorrow-radio/guide/installation) |
| はじめに | [Quick Start](https://watanabe3tipapa.github.io/tomorrow-radio/guide/quickstart) |
| コマンド一覧 | [CLI Reference](https://watanabe3tipapa.github.io/tomorrow-radio/guide/cli-reference) |

## License

This project is licensed under the MIT License.
