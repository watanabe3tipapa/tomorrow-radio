import assert from "node:assert/strict"
import { existsSync, rmSync, statSync } from "node:fs"
import test from "node:test"
import { once } from "node:events"

import { Recorder } from "../dist/recorder/recorder.js"
import { buildRecordCommand } from "../dist/radiko/stream.js"

test("Radiko用ヘッダをCRLF区切りの単一ブロックで渡す", () => {
  const { args } = buildRecordCommand(
    "https://example.invalid/playlist.m3u8",
    "test-token",
    "JP13",
    "recording.m4a",
    "m4a",
  )
  const headerIndex = args.indexOf("-headers")

  assert.notEqual(headerIndex, -1)
  assert.equal(args.filter((arg) => arg === "-headers").length, 1)
  assert.equal(
    args[headerIndex + 1],
    "X-Radiko-AuthToken: test-token\r\nX-Radiko-AreaId: JP13\r\n",
  )
  assert.ok(args.includes("-nostdin"))
})

test("停止要求でFFmpegを正常終了し、出力ファイルを確定する", async () => {
  const outputPath = "/tmp/tomorrow-radio-recorder-test.m4a"
  rmSync(outputPath, { force: true })

  const recorder = new Recorder()
  const done = once(recorder, "done")
  const errors = once(recorder, "error").then(([error]) => {
    throw error
  })

  recorder.start({
    bin: "ffmpeg",
    args: [
      "-re",
      "-f", "lavfi",
      "-i", "sine=frequency=1000:sample_rate=44100",
      "-t", "10",
      "-vn",
      "-acodec", "aac",
      outputPath,
    ],
    outputPath,
  })

  await new Promise((resolve) => setTimeout(resolve, 250))
  recorder.stop()
  await Promise.race([done, errors])

  assert.equal(recorder.running, false)
  assert.equal(existsSync(outputPath), true)
  assert.ok(statSync(outputPath).size > 0)
  rmSync(outputPath, { force: true })
})
