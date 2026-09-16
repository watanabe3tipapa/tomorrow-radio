import { test } from "node:test"
import assert from "node:assert/strict"
import { areaName, mergeStations } from "../dist/sources/playable.js"

test("areaName は radiko のエリアIDを日本語名へ変換する", () => {
  assert.equal(areaName("JP1"), "北海道")
  assert.equal(areaName("JP13"), "東京")
  assert.equal(areaName("JP47"), "沖縄")
  assert.equal(areaName("JP999"), "JP999")
  assert.equal(areaName("OUT"), "OUT")
})

test("mergeStations はエリア内局を優先し、代表局を重複なしで追加する", () => {
  const area = [
    { id: "HBC", name: "HBC北海道放送", source: "radiko" },
    { id: "STV", name: "STVラジオ", source: "radiko" },
  ]
  const merged = mergeStations(area, [
    { id: "HBC", name: "HBC北海道放送" },
    { id: "JOQR", name: "文化放送" },
  ])
  assert.deepEqual(
    merged.map((s) => s.id),
    ["HBC", "STV", "JOQR"],
  )
  assert.equal(merged[2].name, "文化放送")
  assert.ok(merged.every((s) => s.source === "radiko"))
})