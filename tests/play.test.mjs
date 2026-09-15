import assert from "node:assert/strict"
import test from "node:test"

import { buildPlayCommand } from "../dist/radiko/stream.js"

test("Radiko再生に認証ヘッダを単一ブロックで渡す", () => {
  const { bin, args } = buildPlayCommand(
    "https://example.invalid/playlist.m3u8",
    "test-token",
    "JP13",
  )

  assert.equal(bin, "ffplay")
  assert.ok(args.includes("-nodisp"))
  assert.ok(args.includes("-autoexit"))
  assert.ok(args.includes("-loglevel"))
  assert.equal(args.filter((arg) => arg === "-headers").length, 1)
  const headerIndex = args.indexOf("-headers")
  assert.equal(
    args[headerIndex + 1],
    "X-Radiko-AuthToken: test-token\r\nX-Radiko-AreaId: JP13\r\n",
  )
  assert.equal(args[args.length - 1], "https://example.invalid/playlist.m3u8")
})

test("音量オプションは0〜100にクランプされる", () => {
  const { args } = buildPlayCommand("https://example.invalid/x.m3u8", "t", "JP13", 150)
  const volumeIndex = args.indexOf("-volume")
  assert.notEqual(volumeIndex, -1)
  assert.equal(args[volumeIndex + 1], "100")
})