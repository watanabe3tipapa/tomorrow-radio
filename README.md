# Tomorrow Radio

[![Version](https://img.shields.io/badge/version-v0.2.3-00a9c6?style=flat-square)](https://github.com/watanabe3tipapa/tomorrow-radio)
[![Deploy VitePress site](https://github.com/watanabe3tipapa/tomorrow-radio/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/watanabe3tipapa/tomorrow-radio/actions/workflows/deploy.yml)
[![Node.js](https://img.shields.io/badge/node.js-22%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-f0a51a?style=flat-square)](https://github.com/watanabe3tipapa/tomorrow-radio#license)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-007f9a?style=flat-square)](https://watanabe3tipapa.github.io/tomorrow-radio/)

**Tomorrow Radio** は、radiko、らじる★らじる、サイマルラジオ、ポッドキャストを1つの操作体系で扱う軽量な録音CLIです。Blessed を使ったトランシーバー風の TUI により、放送局の選択から録音開始・停止、予約録音までをターミナル上で操作できます。なおリポジトリ説明には「調整中」と明記されています。

<img src="./assets/UC900.png" alt="Tomorrow Radio TUIの画面。信号メーター、局情報、ログ、録音状態を表示している。" width="720">

## v0.2.3 ハイライト

v0.2.3 の変更点（README からの要約）:

- Radiko の認証済み HLS 録音を安定化。FFmpeg に渡す認証ヘッダを CRLF 区切りの単一ブロックに統一。
- `auth2` の応答から配信エリアを取得し、対象地域外の状態を認証成功として扱わないよう修正。
- TUI からの停止処理で FFmpeg に終了指示を送り、m4a のメタデータ確定後に終了するよう改善。
- ドキュメントサイトを受信機／電波のコンセプトで再設計。

> 注意: Radiko の利用可否は配信エリアやサービス側の仕様に依存します。対象地域外の場合は録音開始前にエラーが表示されます。

## 主な機能

- Multi-Source: radiko、らじる★らじる、サイマルラジオ、任意のポッドキャストを扱えます。
- Station ID Auto-Detect: 局 ID から配信元を自動判別します（例: `tomorrow-radio live rajiru_r1_tokyo`）。
- Signal Meter TUI: 信号メーター、番組情報、ログ、ステータスを 4 ペインの受信機風 UI で表示。
- PTT Record: `Enter` キーで録音を開始・停止できる操作系。
- TimeFree: radiko のタイムフリー録音に対応。
- cron Scheduling: 常駐プロセスを必要とせず、cron 形式へ予約録音をエクスポート可能。
- Lightweight: 実行時の主要依存は Blessed と Commander。録音処理には FFmpeg を使用。

## 要件

- Node.js: 22 以上（CLI およびドキュメントのビルド/実行に使用）
- FFmpeg: ライブ配信、タイムフリー、ポッドキャストの録音・保存に必要

## クイックスタート（README に記載の例）

インストール後、以下のコマンド例で認証確認、局の検索、TUI 起動、個別配信元の録音が行えます（README にある例をそのまま記載しています）。

```bash
# 認証確認（radiko）
# tomorrow-radio コマンドはパッケージの実行ファイルにマッピングされています
tomorrow-radio status

# 対応局を一覧表示
tomorrow-radio scan

# トランシーバー風TUIを起動
tomorrow-radio

# radikoを録音（例: TBS を 1800 秒）
tomorrow-radio live TBS --duration 1800

# らじる★らじるを録音（配信元を自動判別の例）
tomorrow-radio live rajiru_r1_tokyo --duration 1800

# サイマルラジオを録音（例）
tomorrow-radio live simul_FM_WING --duration 3600

# ポッドキャストのフィードを取得（例）
tomorrow-radio podcast feed <url>
```

注: 上記は README に示された利用例です。詳細なコマンド一覧やオプションはドキュメントを参照してください。

## ドキュメント

詳細な導入方法やコマンド一覧は GitHub Pages のドキュメントを参照してください。

| 内容 | リンク |
| --- | --- |
| インストール | https://watanabe3tipapa.github.io/tomorrow-radio/guide/installation |
| はじめに（Quick Start） | https://watanabe3tipapa.github.io/tomorrow-radio/guide/quickstart |
| コマンド一覧（CLI Reference） | https://watanabe3tipapa.github.io/tomorrow-radio/guide/cli-reference |

## 開発者向け（パッケージに定義されているスクリプト）

package.json に定義されているスクリプトの例（README と package.json の内容に基づく）:

```bash
# TypeScript をビルド
npm run build

# 開発用ウォッチビルド
npm run dev

# 型チェックのみ
npm run typecheck

# ビルドしてテストを実行
npm run test

# ビルド済みコードを直接起動
npm start

# ドキュメントのローカル起動/ビルド/プレビュー
npm run docs:dev
npm run docs:build
npm run docs:preview
```

実行にあたっては Node.js（22+） と FFmpeg が必要です。

## 主なファイル/ディレクトリ

リポジトリのルートに含まれる主なファイル・ディレクトリ（README の記載に基づく）:

- .github
- .gitignore
- DEV-MEMO.md
- README.md
- USAGE.md
- assets/
- docs/
- package-lock.json
- package.json
- src/
- tests/
- tsconfig.json

## 開発・保守状態

README の説明に「調整中」と明記されています。バージョン表記は v0.2.3、ドキュメントは GitHub Pages で公開されています。

## License

このプロジェクトは MIT License の下で配布されています。
