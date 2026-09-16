import assert from "node:assert/strict"
import test from "node:test"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

function auth1Headers() {
  return {
    headers: {
      "X-Radiko-AuthToken": "FAKE-TOKEN",
      "X-Radiko-KeyOffset": "8",
      "X-Radiko-KeyLength": "16",
    },
  }
}

function playerBody() {
  return "var k = { 'pc_html5', 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' };"
}

function freshAuthModule() {
  const home = mkdtempSync(join(tmpdir(), "tr-auth-"))
  process.env.HOME = home
  return import("../dist/radiko/auth.js")
}

async function mockFetchHandler(onRequest) {
  const realFetch = globalThis.fetch
  globalThis.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input)
    return onRequest(url)
  }
  return () => {
    globalThis.fetch = realFetch
  }
}

test("auth2 failed: 200 (本文異常) は自動リトライされ最終的に認証成功する", async () => {
  const { authenticate } = await freshAuthModule()

  const calls = []
  let auth2Count = 0
  const restore = await mockFetchHandler(async (url) => {
    if (url.includes("/auth1")) {
      calls.push("auth1")
      return new Response("", { status: 200, ...auth1Headers() })
    }
    if (url.includes("playerCommon.js")) return new Response(playerBody(), { status: 200 })
    if (url.includes("/auth2")) {
      calls.push("auth2")
      auth2Count++
      if (auth2Count <= 2) return new Response("<html>rate limited</html>", { status: 200 })
      return new Response("JP13,東京,tokyo Japan", { status: 200 })
    }
    return new Response("", { status: 404 })
  })

  const session = await authenticate(true)
  assert.equal(session.areaId, "JP13")
  assert.ok(auth2Count >= 3, "2回の異常後に3回目の成功が必要")
  assert.ok(calls.filter((c) => c === "auth1").length >= 3, "トークンを取り直してリトライ")

  restore()
})

test("auth2 HTTP 403 はリトライせず即エラー (配信エリア外)", async () => {
  const { authenticate } = await freshAuthModule()

  let auth2Count = 0
  const restore = await mockFetchHandler(async (url) => {
    if (url.includes("/auth1")) return new Response("", { status: 200, ...auth1Headers() })
    if (url.includes("playerCommon.js")) return new Response(playerBody(), { status: 200 })
    if (url.includes("/auth2")) {
      auth2Count++
      return new Response("", { status: 403 })
    }
    return new Response("", { status: 404 })
  })

  await assert.rejects(authenticate(true), /403/)
  assert.equal(auth2Count, 1, "403 は1回で打ち切るべき")

  restore()
})

test("auth2 が OUT エリアを返したらエリア外として即エラー", async () => {
  const { authenticate } = await freshAuthModule()

  const restore = await mockFetchHandler(async (url) => {
    if (url.includes("/auth1")) return new Response("", { status: 200, ...auth1Headers() })
    if (url.includes("playerCommon.js")) return new Response(playerBody(), { status: 200 })
    if (url.includes("/auth2")) return new Response("OUT,out,outside", { status: 200 })
    return new Response("", { status: 404 })
  })

  await assert.rejects(authenticate(true), /配信対象地域外/)

  restore()
})