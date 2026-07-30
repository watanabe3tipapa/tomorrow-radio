import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import type { AuthSession } from "./types.js"

const AUTH_CACHE_PATH = join(homedir(), "tomorrow-radio", "auth.json")
const CACHE_TTL_MS = 60 * 60 * 1000

function readCache(): AuthSession | null {
  try {
    const raw = readFileSync(AUTH_CACHE_PATH, "utf-8")
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function writeCache(session: AuthSession): void {
  const dir = join(homedir(), "tomorrow-radio")
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(AUTH_CACHE_PATH, JSON.stringify(session))
}

export async function authenticate(force = false): Promise<AuthSession> {
  if (!force) {
    const cached = readCache()
    if (cached && Date.now() - cached.acquiredAt < CACHE_TTL_MS) {
      return cached
    }
  }

  const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

  // Step 1: get area
  const areaRes = await fetch("https://api.radiko.jp/apparea/area", {
    headers: { "User-Agent": ua },
  })
  const areaText = await areaRes.text()
  const areaMatch = areaText.match(/class="(.+?)"/)
  const areaId = areaMatch ? areaMatch[1] : "JP13"

  // Step 2: auth1
  const auth1Res = await fetch("https://radiko.jp/v2/api/auth1", {
    method: "GET",
    headers: {
      "User-Agent": ua,
      "X-Radiko-App": "pc_html5",
      "X-Radiko-App-Version": "0.0.1",
      "X-Radiko-Device": "pc",
      "X-Radiko-User": "dummy_user",
    },
  })
  const token = auth1Res.headers.get("X-Radiko-AuthToken")
  const keyOffsetStr = auth1Res.headers.get("X-Radiko-KeyOffset")
  if (!token || !keyOffsetStr) {
    throw new Error("auth1 failed: missing token or keyoffset")
  }
  const keyOffset = Number.parseInt(keyOffsetStr, 10)

  // Step 3: get auth key from playerCommon.js
  const playerRes = await fetch("https://radiko.jp/apps/js/playerCommon.js", {
    headers: { "User-Agent": ua },
  })
  const playerText = await playerRes.text()
  const keyMatch = playerText.match(/'pc_html5',\s*'(.+?)'/)
  if (!keyMatch) {
    throw new Error("auth1 failed: could not extract auth key")
  }
  const fullKey = keyMatch[1]
  const partialKey = btoa(fullKey.slice(keyOffset, keyOffset + 16))

  // Step 4: auth2
  const auth2Res = await fetch("https://radiko.jp/v2/api/auth2", {
    method: "GET",
    headers: {
      "User-Agent": ua,
      "X-Radiko-AuthToken": token,
      "X-Radiko-PartialKey": partialKey,
    },
  })
  if (!auth2Res.ok) {
    throw new Error(`auth2 failed: ${auth2Res.status}`)
  }

  const session: AuthSession = {
    token,
    areaId,
    acquiredAt: Date.now(),
  }
  writeCache(session)
  return session
}
