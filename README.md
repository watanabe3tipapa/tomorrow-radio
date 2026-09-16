# Tomorrow Radio

[![Version](https://img.shields.io/badge/version-v0.2.4-00a9c6?style=flat-square)](https://github.com/watanabe3tipapa/tomorrow-radio)
[![Deploy VitePress site](https://github.com/watanabe3tipapa/tomorrow-radio/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/watanabe3tipapa/tomorrow-radio/actions/workflows/deploy.yml)
[![Node.js](https://img.shields.io/badge/node.js-22%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-007f9a?style=flat-square)](https://watanabe3tipapa.github.io/tomorrow-radio/)

**Tomorrow Radio** は、radiko、らじる★らじる、サイマルラジオ、ポッドキャストを1つの操作体系で扱う軽量な再生・録音CLIです。**基本操作はライブ再生** (`tomorrow-radio TBS`)。Blessed を使ったトランシーバー風の TUI により、放送局の選択・ライブ再生・録音開始/停止、予約録音までをターミナル上で操作できます。録音は必要なときだけ行います。

<img src="./assets/UC900.png" alt="Tomorrow Radio TUIの画面。信号メーター、局情報、ログ、録音状態を表示している。" width="720">

## v0.2.4 ハイライト

- **基本動作をライブ再生に変更**: CLI は局ID直接指定 (`tomorrow-radio TBS`) で再生、TUI は `Enter` で再生 / `r` で録音 (録音は必要時のみ)。
- `playable` コマンドを追加: 現エリア表示付きで「Live再生可能な局」を一覧表示し、配信エリア外 (geo ブロック) を判別。
- ライブ再生・録音を alliance-stream CDN に統一し、認証ヘッダを CRLF 区切りの単一ブロックで FFmpeg に渡す方式に安定化。
- `auth2` の一時エラー (`auth2 failed: 200`) を自動リトライ化し、エラーメッセージに radiko の応答本文を表示。

> 注意: Radiko の利用可否は配信エリアやサービス側の仕様に依存します。対象地域外の場合は録音開始前にエラーが表示されます。

## 主な機能

- Multi-Source: radiko、らじる★らじる、サイマルラジオ、任意のポッドキャストを扱えます。
- Station ID Auto-Detect: 局 ID から配信元を自動判別します（例: `tomorrow-radio rajiru_r1_tokyo`）。
- Live-first Listening: 基本はライブ再生。`tomorrow-radio TBS` で局 ID 指定だけで再生可能。
- Signal Meter TUI: 信号メーター、番組情報、ログ、ステータスを 4 ペインの受信機風 UI で表示。TUI では `Enter` で再生、`r` で録音。
- TimeFree: radiko のタイムフリー録音に対応。
- cron Scheduling: 常駐プロセスを必要とせず、cron 形式へ予約録音をエクスポート可能。
- Lightweight: 実行時の主要依存は Blessed と Commander。録音処理には FFmpeg を使用。

## 要件

- Node.js: 22 以上（CLI およびドキュメントのビルド/実行に使用）
- FFmpeg: ライブ配信、タイムフリー、ポッドキャストの録音・保存に必要

## クイックスタート（README に記載の例）

インストール後、以下のコマンド例で認証確認、局の検索、ライブ再生、TUI 起動、個別配信元の録音が行えます。

```bash
# 認証確認（radiko）
# tomorrow-radio コマンドはパッケージの実行ファイルにマッピングされています
tomorrow-radio status

# 対応局を一覧表示
tomorrow-radio scan

# トランシーバー風TUIを起動
tomorrow-radio

# ライブ再生（基本動作: 局ID直接指定）
tomorrow-radio TBS

# Live再生可能な局を一覧表示（エリア判定）
tomorrow-radio playable

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

バージョン表記は v0.2.4、ドキュメントは GitHub Pages で公開されています。

## License

ライセンスは未指定です（LICENSE ファイルおよび package.json の license 欄は未設定）。
