# Installation

## Prerequisites

- **Node.js** 22+
- **FFmpeg** (radiko ストリームの録音に使用)

```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg

# Windows (Chocolatey)
choco install ffmpeg
```

## Install

```bash
npm install -g tomorrow-radio
```

Or from source:

```bash
git clone https://github.com/watanabe3tipapa/tomorrow-radio.git
cd tomorrow-radio
npm install
npm run build
npm link
```

## Verify

```bash
tomorrow-radio status
```
