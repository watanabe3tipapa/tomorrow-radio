<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"

const signalLevel = ref(0)
const currentStation = ref("TBS")
const currentSource = ref("RADIKO")
const mode = ref("LIVE")
const outputFormat = ref("m4a")
const elapsed = ref("--:--:--")
const chatLines = ref<{ text: string; color: string }[]>([])
const logLines = ref<{ text: string; time: string }[]>([])
const pttStatus = ref("[▶ PTT]  Enter: Record   Tab: Focus   s: Station   q: Quit")
const recording = ref(false)

let cursorInterval: ReturnType<typeof setInterval> | undefined
let animTimer: ReturnType<typeof setTimeout>[] = []

function time(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
}

function addLog(text: string) {
  logLines.value.push({ text, time: time() })
  if (logLines.value.length > 20) logLines.value = logLines.value.slice(-20)
}

function addChat(text: string, color: string) {
  chatLines.value.push({ text, color })
  if (chatLines.value.length > 100) chatLines.value = chatLines.value.slice(-100)
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    const t = setTimeout(r, ms)
    animTimer.push(t)
  })
}

function cancelAll() {
  if (cursorInterval) clearInterval(cursorInterval)
  animTimer.forEach(clearTimeout)
  animTimer = []
}

async function runDemo() {
  cancelAll()

  chatLines.value = []
  logLines.value = []
  signalLevel.value = 0
  elapsed.value = "--:--:--"
  recording.value = false
  currentStation.value = "TBS"
  currentSource.value = "RADIKO"
  mode.value = "LIVE"

  // Phase 1: Startup
  addLog("Tomorrow Radio 起動")
  await delay(800)
  addLog("認証確認中...")
  signalLevel.value = 30
  await delay(1200)

  // Phase 2: Connected
  addLog("認証完了  エリア: JP13")
  signalLevel.value = 100
  pttStatus.value = "[▶ PTT]  Connected  Enter: Record"
  addChat("[SYS] 選局: TBS (radiko)", "cyan")
  addChat("[NOW] 伊集院光の週末ラジオ  (13:00〜15:00)", "white")
  await delay(1000)

  // Phase 3: Start recording (radiko)
  pttStatus.value = "[▶ RECORDING]  Enter: Stop   s: Station   q: Quit"
  recording.value = true
  await delay(400)
  addChat("[REC] 録音開始 → TBS_20260730_130000.m4a", "red")
  addLog("録音開始: TBS (LIVE) → TBS_20260730_130000.m4a")

  for (let sec = 5; sec <= 15; sec += 5) {
    elapsed.value = `00:${String(sec).padStart(2, "0")}/01:00:00`
    addLog(`録音中... ${elapsed.value}`)
    await delay(400)
  }

  addChat("[DONE] 録音完了: TBS_20260730_130000.m4a", "green")
  addLog("録音完了: TBS_20260730_130000.m4a")
  recording.value = false
  elapsed.value = "00:15/01:00:00"
  await delay(500)

  // Phase 4: Switch to らじる★らじる
  pttStatus.value = "[SYS]  Switching source..."
  await delay(600)
  currentStation.value = "rajiru_r1_tokyo"
  currentSource.value = "らじる"
  mode.value = "LIVE"
  signalLevel.value = 90
  addLog("選局: rajiru_r1_tokyo (らじる★らじる)")
  addChat("[SYS] 選局: rajiru_r1_tokyo (らじる★らじる)", "cyan")
  await delay(600)
  addChat("[NOW] マイあさ！  (05:00〜05:55)", "white")
  await delay(800)

  // Phase 5: Record NHK
  recording.value = true
  pttStatus.value = "[▶ RECORDING]  NHK R1 東京 録音中..."
  await delay(400)
  addChat("[REC] 録音開始 → rajiru_r1_tokyo_20260730_050000.m4a", "red")
  addLog("録音開始: NHK R1 東京 (LIVE)")

  for (let sec = 5; sec <= 15; sec += 5) {
    elapsed.value = `00:${String(sec).padStart(2, "0")}/01:00:00`
    await delay(300)
  }

  addChat("[DONE] 録音完了: rajiru_r1_tokyo_20260730_050000.m4a", "green")
  addLog("録音完了: rajiru_r1_tokyo_20260730_050000.m4a")
  recording.value = false
  await delay(400)

  // Phase 6: SimulRadio
  currentStation.value = "simul_FM_WING"
  currentSource.value = "SIMUL"
  signalLevel.value = 75
  addLog("選局: simul_FM_WING (サイマルラジオ)")
  addChat("[SYS] 選局: simul_FM_WING (北海道)", "cyan")
  await delay(600)
  addChat("[NOW] FM WING  (コミュニティFM)", "white")
  await delay(800)

  recording.value = true
  pttStatus.value = "[▶ RECORDING]  SimulRadio 録音中..."
  await delay(300)
  addChat("[REC] 録音開始 → simul_FM_WING_20260730_060000.m4a", "red")

  for (let sec = 5; sec <= 15; sec += 5) {
    elapsed.value = `00:${String(sec).padStart(2, "0")}/01:00:00`
    await delay(300)
  }

  addChat("[DONE] 録音完了: simul_FM_WING_20260730_060000.m4a", "green")
  addLog("録音完了: simul_FM_WING_20260730_060000.m4a")
  recording.value = false
  await delay(400)

  // Phase 7: Podcast
  currentStation.value = "podcast"
  currentSource.value = "RSS"
  signalLevel.value = 85
  addLog("ポッドキャストフィード取得: The Daily")
  addChat("[SYS] ポッドキャスト: The Daily (NYT)", "cyan")
  await delay(600)
  addChat("[NOW] Israel, AIPAC, and Difficult Questions for Democrats", "white")
  await delay(400)

  addLog("エピソード #0 をダウンロード中...")
  await delay(800)
  addLog("ダウンロード完了: The_Daily_ep0.mp3")
  addChat("[DONE] ポッドキャストダウンロード完了", "green")
  await delay(600)

  // Phase 8: Wrap
  pttStatus.value = "[▶ PTT]  Enter: Record   Tab: Focus   s: Station   m: Mode   f: Format   q: Quit"
  addLog("全ソース対応: radiko / らじる★らじる / サイマルラジオ / ポッドキャスト")
  await delay(2500)

  runDemo()
}

onMounted(() => {
  cursorInterval = setInterval(() => {
    // keep Vue alive
  }, 500)
  setTimeout(() => runDemo(), 500)
})

onUnmounted(() => {
  cancelAll()
})
</script>

<template>
  <div class="tui-wrapper">
    <div class="tui">
      <!-- Header -->
      <div class="pane header">
        <div class="signal-meter">
          <span class="label">SIG</span>
          <div class="bars-container">
            <div
              v-for="i in 8"
              :key="i"
              class="bar"
              :class="{ active: i <= Math.round(signalLevel / 12.5) }"
              :style="{ animationDelay: i * 0.05 + 's' }"
            />
          </div>
        </div>
        <span class="elapsed" :class="{ active: recording }">
          {{ elapsed }}
        </span>
        <span class="dot" :class="{ rec: recording, alive: signalLevel > 0 }">
          {{ recording ? "● REC" : signalLevel > 0 ? "●" : "● OFF" }}
        </span>
        <span class="separator">&#9474;</span>
        <span class="station-name">{{ currentStation }}</span>
        <span class="separator">&#9474;</span>
        <span class="source-tag">{{ currentSource }}</span>
        <span class="separator">&#9474;</span>
        <span class="mode" :class="mode.toLowerCase()">{{ mode }}</span>
        <span class="separator">&#9474;</span>
        <span class="format">{{ outputFormat }}</span>
      </div>

      <!-- Main chat area -->
      <div class="pane main">
        <div
          v-for="(msg, i) in chatLines"
          :key="i"
          class="msg"
          :style="{ color: msg.color === 'red' ? '#f44' : msg.color === 'green' ? '#4f4' : msg.color === 'cyan' ? '#0cf' : msg.color === 'magenta' ? '#f4f' : '#ccc' }"
        >
          {{ msg.text }}
        </div>
      </div>

      <!-- Activity log -->
      <div class="pane log-pane">
        <div v-for="(entry, i) in logLines" :key="i" class="log-entry">
          <span class="log-text">{{ entry.text }}</span>
          <span class="log-time">{{ entry.time }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="pane footer">
        {{ pttStatus }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-wrapper {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  margin: 24px 0;
}

.tui {
  font-family: "SF Mono", "Fira Code", "Cascadia Code", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #c0c0c0;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 4px;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid #0ff;
  background: #111;
  color: #ccc;
  font-size: 12px;
}

.signal-meter {
  display: flex;
  align-items: center;
  gap: 4px;
}

.label {
  color: #888;
  font-weight: bold;
  margin-right: 2px;
}

.bars-container {
  display: flex;
  gap: 2px;
}

.bar {
  width: 8px;
  height: 14px;
  background: #222;
  border-radius: 1px;
  transition: background 0.3s;
}

.bar.active {
  background: #0f0;
  animation: pulse 1s ease-in-out infinite;
}

.bar:nth-child(-n+4).active { background: #f00; }
.bar:nth-child(-n+6).active { background: #ff0; }
.bar:nth-child(-n+8).active { background: #0f0; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.elapsed {
  color: #666;
  font-weight: bold;
}

.elapsed.active {
  color: #f44;
}

.dot {
  color: #f00;
  font-size: 10px;
}

.dot.alive {
  color: #0f0;
}

.dot.rec {
  color: #f00;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.separator {
  color: #444;
}

.station-name {
  color: #fff;
  font-weight: bold;
}

.source-tag {
  color: #0cf;
  font-weight: bold;
  font-size: 10px;
  padding: 1px 4px;
  border: 1px solid #0cf;
  border-radius: 3px;
}

.mode {
  padding: 0 6px;
  font-weight: bold;
}

.mode.live { color: #0f0; }
.mode.timefree { color: #ff0; }

.format {
  color: #aaa;
  font-weight: bold;
}

.main {
  padding: 10px;
  min-height: 120px;
  border-bottom: 1px solid #444;
  background: #0d0d0d;
}

.msg {
  margin-bottom: 6px;
  white-space: pre-wrap;
  word-break: break-word;
}

.log-pane {
  padding: 6px 10px;
  min-height: 60px;
  max-height: 90px;
  overflow-y: auto;
  border-bottom: 1px solid #660;
  background: #0a0a0a;
  font-size: 11px;
}

.log-entry {
  display: flex;
  justify-content: space-between;
  color: #888;
}

.log-text { color: #aa8; }
.log-time { color: #555; }

.footer {
  padding: 4px 10px;
  background: #005;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}
</style>
