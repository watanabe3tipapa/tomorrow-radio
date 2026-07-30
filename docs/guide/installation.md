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

## Verify

インストール後、次のコマンドで動作確認します:

```bash
tomorrow-radio status
```

正しく認証できれば、radiko の認証ステータスが表示されます。
