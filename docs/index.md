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
    details: 録音状態・経過時間をリアルタイム表示。信号強度バーが接続状態を視覚化。
  - title: PTT Record
    details: Enter で録音開始/停止。無線機の PTT ボタンさながらの操作感。
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

<div style="max-width: 720px; margin: 0 auto">
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

# 4. らじる★らじる録音 (ソース自動判別)
tomorrow-radio live rajiru_r1_tokyo --duration 1800

# 5. サイマルラジオ録音
tomorrow-radio live simul_FM_WING --duration 3600

# 6. ポッドキャスト
tomorrow-radio podcast feed https://feeds.simplecast.com/54nAGcIl
tomorrow-radio podcast download https://feeds.simplecast.com/54nAGcIl 0
```

## Why Tomorrow Radio?

| アプローチ | 操作感 | 軽量性 |
|-----------|--------|--------|
| rfriends | Web GUI (便利だが重い) | ❌ 要 Web サーバ・samba |
| radika (Windows) | GUI (Windows 限定) | ❌ Windows 必須 |
| **Tomorrow Radio** | **TUI トランシーバー風** | **FFmpeg + Node.js のみ** |

ただの録音ツールではなく、「ラジオを受信している」という体験を提供します。
