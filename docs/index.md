---
layout: home

hero:
  name: Tomorrow Radio
  text: ラジオ録音を、トランシーバーの操作感で
  tagline:  radiko / らじる★らじる / サイマルラジオ / ポッドキャスト  – ターミナルがラジオになる
  actions:
    - theme: brand
      text: インストール
      link: /guide/installation
    - theme: alt
      text: CLI リファレンス
      link: /guide/cli-reference

features:
  - title: Multi-Source
    details: radiko (16局) + らじる★らじる (26局) + サイマルラジオ (84局) + 任意ポッドキャスト。Station ID 自動判別。
  - title: Signal Meter
    details: 再生・録音状態・経過時間をリアルタイム表示。信号強度バーが接続状態を視覚化。
  - title: Live-first Listening
    details: 基本はライブ再生。Enter で再生開始/停止、録音は必要なときだけ r キー。
  - title: 4-Pane Dashboard
    details: 信号・番組情報・ログ・ステータスを一画面で。選局・モード切替もキー一発。
  - title: Lightweight
    details: rfriends のような Web サーバ不要。FFmpeg だけあれば即動作。3つの npm 依存。
  - title: cron Scheduling
    details: 常駐デーモン不要。cron エクスポートで OS のスケジューラと連携。
---

<script setup>
import TuiDemo from "./components/TuiDemo.vue"
</script>

<div class="tui-demo-wrapper">
  <TuiDemo />
</div>

## Quick Start

```bash
# 1. 認証確認 (radiko)
tomorrow-radio status

# 2. 全ソーススキャン (126局)
tomorrow-radio scan

# 3. トランシーバー起動
tomorrow-radio

# 4. ライブ再生 (基本動作: 局ID直接指定)
tomorrow-radio TBS
tomorrow-radio rajiru_r1_tokyo

# 5. らじる★らじる録音 (ソース自動判別)
tomorrow-radio live rajiru_r1_tokyo --duration 1800

# 6. サイマルラジオ録音
tomorrow-radio live simul_FM_WING --duration 3600

# 7. ポッドキャスト
tomorrow-radio podcast feed https://feeds.simplecast.com/54nAGcIl
tomorrow-radio podcast download https://feeds.simplecast.com/54nAGcIl 0
```

## Why Tomorrow Radio?

<div class="comparison-table">

| | rfriends | radika (Windows) | **Tomorrow Radio** |
|---|---|---|---|
| **操作感** | Web GUI (便利だが重い) | GUI (Windows 限定) | **TUI トランシーバー風** |
| **軽量性** | ❌ 要 Web サーバ・samba | ❌ Windows 必須 | **FFmpeg + Node.js のみ** |
| **対応ソース** | radiko | radiko | radiko / らじる★らじる / サイマルラジオ / ポッドキャスト |
| **予約録音** | Web 操作 | GUI 操作 | cron エクスポート (OS ネイティブ) |
| **動作環境** | Linux サーバ必須 | Windows 限定 | **macOS / Linux / Windows** (Node.js) |

</div>

ただの録音ツールではなく、「ラジオを受信している」という体験を提供します。
