---
layout: home

hero:
  name: Tomorrow Radio
  text: ラジコ録音を、トランシーバーの操作感で
  tagline: Signal Meter · PTT Record · 4-Pane TUI — ターミナルがラジオになる
  actions:
    - theme: brand
      text: インストール
      link: /guide/installation
    - theme: alt
      text: CLI リファレンス
      link: /guide/cli-reference

features:
  - title: Signal Meter
    details: 録音状態・経過時間をリアルタイム表示。信号強度バーが受信状態を視覚化。
  - title: PTT Record
    details: Enter で録音開始/停止。無線機の PTT ボタンさながらの操作感。
  - title: 4-Pane Dashboard
    details: 信号・番組情報・ログ・ステータスを一画面で。Web ダッシュボード風。
  - title: Lightweight
    details: rfriends のような重い Web サーバ不要。FFmpeg だけあれば動作。
---

<script setup>
import TuiDemo from "./components/TuiDemo.vue"
</script>

<div style="max-width: 720px; margin: 0 auto">
  <TuiDemo />
</div>

## Quick Start

```bash
# 1. 認証確認
tomorrow-radio status

# 2. 放送局スキャン
tomorrow-radio scan

# 3. トランシーバー起動
tomorrow-radio
```

## Why Tomorrow Radio?

| アプローチ | 操作感 | 軽量性 |
|-----------|--------|--------|
| rfriends | Web GUI (便利だが重い) | ❌ 要 Web サーバ・samba |
| radika (Windows) | GUI (Windows 限定) | ❌ Windows 必須 |
| **Tomorrow Radio** | **TUI トランシーバー風** | **FFmpeg のみ** |

ただの録音ツールではなく、「ラジオを受信している」という体験を提供します。
