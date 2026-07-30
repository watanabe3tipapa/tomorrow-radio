import blessed, { type Widgets } from "blessed"
type Screen = Widgets.Screen
import type { ScheduleEntry } from "../scheduler/store.js"

export function showScheduleDialog(
  screen: Screen,
  entries: ScheduleEntry[]
): void {
  const items =
    entries.length === 0
      ? ["(予約なし)"]
      : entries.map(
          (e) =>
            `${e.start.slice(0, 8)} ${e.start.slice(8, 10)}:${e.start.slice(10, 12)} ${e.station} ${e.duration}秒 ${e.format.toUpperCase()}`
        )

  const list = blessed.list({
    parent: screen,
    top: "center",
    left: "center",
    width: "60%",
    height: Math.min(items.length + 2, 16),
    border: { type: "line" },
    style: {
      border: { fg: "yellow" },
      selected: { fg: "white", bg: "blue" },
      fg: "white",
      bg: "black",
    },
    keys: true,
    vi: true,
    items,
    label: " Schedule ",
  })

  list.on("cancel", () => {
    screen.remove(list)
    screen.render()
  })

  list.on("select", () => {
    screen.remove(list)
    screen.render()
  })

  screen.append(list)
  list.focus()
  screen.render()
}
