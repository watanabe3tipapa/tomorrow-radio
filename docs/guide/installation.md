# Installation

## Prerequisites

| 必須 | バージョン | 用途 |
|------|-----------|------|
| <kbd>Node.js</kbd> | 22+ | ランタイム |
| <kbd>FFmpeg</kbd> | 4.0+ | ストリーム録音 |
| <kbd>Git</kbd> | — | ソースコード取得 |

### FFmpeg のインストール

::: code-group

```bash [macOS]
brew install ffmpeg
```

```bash [Ubuntu / Debian]
sudo apt install ffmpeg
```

```bash [Windows (Chocolatey)]
choco install ffmpeg
```

:::

## Install from source

```bash
git clone https://github.com/watanabe3tipapa/tomorrow-radio.git
cd tomorrow-radio
npm install
npm run build
npm link
```

### `npm link`（グローバルインストール）とは

`npm link` は npm のグローバル bin（macOS では `~/.npm-global/bin` など）に
`tomorrow-radio` を登録し、**どのディレクトリからでも**実行できるようにします。
npm レジストリへ publish するのではなく、**このリポジトリのビルド成果物
`dist/index.js` を直接参照**します。

- ソースを変更したら `npm run build` で再ビルド → 即反映（publish 不要）
- リポジトリ更新後は `git pull && npm run build`
- 複数クローンがある場合、リンクは**最後に `npm link` したディレクトリ**を指します。
  古い clone のまま古いコードが動くことがあるため `readlink $(which tomorrow-radio)` で確認
- 解除は `npm unlink -g tomorrow-radio`

## Verify

インストール後、次のコマンドで動作確認します:

```bash
tomorrow-radio status
```

正しく認証できれば、radiko の認証ステータスが表示されます。
