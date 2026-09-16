import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import type { AuthSession } from "./types.js"

const AUTH_CACHE_PATH = join(homedir(), "tomorrow-radio", "auth.json")
const CACHE_TTL_MS = 60 * 60 * 1000
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

function isValidAreaId(areaId: string): boolean {
  // radiko のエリアIDは JP1〜JP47。1桁エリア (JP1〜JP9) も有効なので
  // \d{2} ではなく \d{1,2} で受ける。JP0 は実在しないが厳密に弾かない。
  return /^JP\d{1,2}$/.test(areaId)
}

function readCache(): AuthSession | null {
  try {
    const raw = readFileSync(AUTH_CACHE_PATH, "utf-8")
    const session = JSON.parse(raw) as AuthSession
    return isValidAreaId(session.areaId) ? session : null
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

  // Step 1: auth1
  const auth1Res = await fetch("https://api.radiko.jp/v2/api/auth1", {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      "X-Radiko-App": "pc_html5",
      "X-Radiko-App-Version": "0.0.1",
      "X-Radiko-Device": "pc",
      "X-Radiko-User": "dummy_user",
    },
  })
  const token = auth1Res.headers.get("X-Radiko-AuthToken")
  const keyOffsetStr = auth1Res.headers.get("X-Radiko-KeyOffset")
  const keyLengthStr = auth1Res.headers.get("X-Radiko-KeyLength")
  if (!auth1Res.ok || !token || !keyOffsetStr || !keyLengthStr) {
    throw new Error("auth1 failed: missing authentication headers")
  }

  const keyOffset = Number.parseInt(keyOffsetStr, 10)
  const keyLength = Number.parseInt(keyLengthStr, 10)
  if (!Number.isSafeInteger(keyOffset) || !Number.isSafeInteger(keyLength) || keyLength <= 0) {
    throw new Error("auth1 failed: invalid partial-key parameters")
  }

  // Step 2: get the current authorization key supplied by Radiko's web player.
  const playerRes = await fetch("https://radiko.jp/apps/js/playerCommon.js", {
    headers: { "User-Agent": USER_AGENT },
  })
  const playerText = await playerRes.text()
  const keyMatch = playerText.match(/'pc_html5',\s*'(.+?)'/)
  if (!keyMatch) {
    throw new Error("auth1 failed: could not extract authorization key")
  }
  const fullKey = keyMatch[1]
  const partialKey = btoa(fullKey.slice(keyOffset, keyOffset + keyLength))

  // Step 3: auth2 returns the listener's actual prefecture area.  The apparea
  // endpoint may return OUT even when the authentication response is valid,
  // which produces an unusable HLS request.
  const auth2Res = await fetch("https://api.radiko.jp/v2/api/auth2", {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      "X-Radiko-Device": "pc",
      "X-Radiko-User": "dummy_user",
      "X-Radiko-AuthToken": token,
      "X-Radiko-PartialKey": partialKey,
    },
  })
  const auth2Text = (await auth2Res.text()).trim()
  const areaId = auth2Text.split(",")[0]?.trim() ?? ""
  if (!auth2Res.ok || !isValidAreaId(areaId)) {
    const reason = areaId === "OUT" ? "Radikoの配信対象地域外です" : `auth2 failed: ${auth2Res.status}`
    throw new Error(reason)
  }

  const session: AuthSession = {
    token,
    areaId,
    acquiredAt: Date.now(),
  }
  writeCache(session)
  return session
}
