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

class AuthError extends Error {
  retryable: boolean

  constructor(message: string, retryable: boolean) {
    super(message)
    this.name = "AuthError"
    this.retryable = retryable
  }
}

function auth2Error(res: Response, body: string): AuthError {
  if (res.status === 403) {
    return new AuthError(
      `auth2 failed: 403 (配信エリア外の可能性。このネットワークからは認証できません)`,
      false,
    )
  }
  // 200 なのにエリアIDが取れない = 回線側の一時的な異常応答 (空・HTML・中途半端な応答)。
  // リトライで解消することが多い。
  const preview = body.slice(0, 60) || "(空)"
  return new AuthError(
    `auth2 failed: ${res.status} (本文 "${preview}" のためエリア判定不可。一時的な異常なら自動リトライされます)`,
    true,
  )
}

async function authenticateOnce(): Promise<AuthSession> {
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
    throw new AuthError(
      `auth1 failed: missing authentication headers (HTTP ${auth1Res.status})`,
      true,
    )
  }

  const keyOffset = Number.parseInt(keyOffsetStr, 10)
  const keyLength = Number.parseInt(keyLengthStr, 10)
  if (!Number.isSafeInteger(keyOffset) || !Number.isSafeInteger(keyLength) || keyLength <= 0) {
    throw new AuthError("auth1 failed: invalid partial-key parameters", false)
  }

  // Step 2: get the current authorization key supplied by Radiko's web player.
  const playerRes = await fetch("https://radiko.jp/apps/js/playerCommon.js", {
    headers: { "User-Agent": USER_AGENT },
  })
  const playerText = await playerRes.text()
  const keyMatch = playerText.match(/'pc_html5',\s*'(.+?)'/)
  if (!keyMatch) {
    throw new AuthError("auth1 failed: could not extract authorization key", true)
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
    if (areaId === "OUT") {
      throw new AuthError(
        "認証エラー: Radikoの配信対象地域外です (OUT エリア. 国外IP / VPN / データセンター経由の可能性)",
        false,
      )
    }
    if (!auth2Res.ok) throw auth2Error(auth2Res, auth2Text)
    throw auth2Error(new Response(null, { status: 200 }), auth2Text)
  }

  return {
    token,
    areaId,
    acquiredAt: Date.now(),
  }
}

export async function authenticate(force = false): Promise<AuthSession> {
  if (!force) {
    const cached = readCache()
    if (cached && Date.now() - cached.acquiredAt < CACHE_TTL_MS) {
      return cached
    }
  }

  // 一時的な応答異常 (auth2 failed: 200 / ネットワーク断など) は
  // 新しいトークンで立て直して最大3回リトライする。
  const maxAttempts = 3
  let lastError: unknown = new Error("authentication failed")

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const session = await authenticateOnce()
      writeCache(session)
      return session
    } catch (e) {
      lastError = e
      const authError = e as AuthError
      const retryable = authError instanceof AuthError ? authError.retryable : true
      if (!retryable || attempt === maxAttempts) break
      const waitMs = 600 * attempt
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }

  throw lastError
}
