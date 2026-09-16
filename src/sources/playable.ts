import type { Station } from "./types.js"

export const AREA_NAMES: Record<string, string> = {
  JP1: "北海道",
  JP2: "青森",
  JP3: "岩手",
  JP4: "宮城",
  JP5: "秋田",
  JP6: "山形",
  JP7: "福島",
  JP8: "茨城",
  JP9: "栃木",
  JP10: "群馬",
  JP11: "埼玉",
  JP12: "千葉",
  JP13: "東京",
  JP14: "神奈川",
  JP15: "新潟",
  JP16: "富山",
  JP17: "石川",
  JP18: "福井",
  JP19: "山梨",
  JP20: "長野",
  JP21: "岐阜",
  JP22: "静岡",
  JP23: "愛知",
  JP24: "三重",
  JP25: "滋賀",
  JP26: "京都",
  JP27: "大阪",
  JP28: "兵庫",
  JP29: "奈良",
  JP30: "和歌山",
  JP31: "鳥取",
  JP32: "島根",
  JP33: "岡山",
  JP34: "広島",
  JP35: "山口",
  JP36: "徳島",
  JP37: "香川",
  JP38: "愛媛",
  JP39: "高知",
  JP40: "福岡",
  JP41: "佐賀",
  JP42: "長崎",
  JP43: "熊本",
  JP44: "大分",
  JP45: "宮崎",
  JP46: "鹿児島",
  JP47: "沖縄",
}

export function areaName(areaId: string): string {
  return AREA_NAMES[areaId] ?? areaId
}

// 他エリアの代表局。自分のエリアと照らし合わせることで
// 「これは Live 再生できる / これは配信エリア外」の違いが分かる。
export const MAJOR_STATIONS: { id: string; name: string }[] = [
  { id: "TBS", name: "TBSラジオ" },
  { id: "LFR", name: "ニッポン放送" },
  { id: "JOQR", name: "文化放送" },
  { id: "JORF", name: "ラジオ日本" },
  { id: "RN1", name: "ラジオNIKKEI第1" },
  { id: "RN2", name: "ラジオNIKKEI第2" },
  { id: "FMJ", name: "TOKYO FM" },
  { id: "FMW", name: "J-WAVE" },
  { id: "HBC", name: "HBC北海道放送" },
  { id: "STV", name: "STVラジオ" },
  { id: "TBC", name: "東北放送" },
  { id: "MBS", name: "MBSラジオ" },
  { id: "ABC", name: "ABCラジオ" },
  { id: "OBC", name: "ラジオ大阪" },
  { id: "FM802", name: "FM802" },
  { id: "TOKAIRADIO", name: "TOKAI RADIO" },
  { id: "RKB", name: "RKBラジオ" },
  { id: "KBC", name: "KBCラジオ" },
]

export function mergeStations(
  areaStations: Station[],
  major: { id: string; name: string }[]
): Station[] {
  const seen = new Set<string>()
  const out: Station[] = []
  for (const s of areaStations) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    out.push({ id: s.id, name: s.name, source: "radiko" })
  }
  for (const m of major) {
    if (seen.has(m.id)) continue
    seen.add(m.id)
    out.push({ id: m.id, name: m.name, source: "radiko" })
  }
  return out
}

export async function probeAll<T extends { id: string }>(
  items: T[],
  probe: (item: T) => Promise<{ ok: boolean; reason?: string }>,
  concurrency = 6
): Promise<Map<string, { ok: boolean; reason?: string }>> {
  const results = new Map<string, { ok: boolean; reason?: string }>()
  let index = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index]
      index++
      try {
        results.set(item.id, await probe(item))
      } catch {
        results.set(item.id, { ok: false, reason: "判定不能" })
      }
    }
  })
  await Promise.all(workers)
  return results
}