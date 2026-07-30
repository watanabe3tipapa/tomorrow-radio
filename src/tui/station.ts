import blessed, { type Widgets } from "blessed"
type Screen = Widgets.Screen

export function showStationDialog(
  screen: Screen,
  stations: { id: string; name: string }[],
  onSelect: (stationId: string) => void
): void {
  const items = stations.map((s) => `${s.id.padEnd(6)} ${s.name}`)

  const list = blessed.list({
    parent: screen,
    top: "center",
    left: "center",
    width: "50%",
    height: Math.min(items.length + 2, 20),
    border: { type: "line" },
    style: {
      border: { fg: "cyan" },
      selected: { fg: "white", bg: "blue" },
      fg: "white",
      bg: "black",
    },
    keys: true,
    vi: true,
    items,
    label: " Select Station ",
  })

  list.on("select", (_item, index) => {
    const stationId = stations[index].id
    screen.remove(list)
    screen.render()
    onSelect(stationId)
  })

  list.on("cancel", () => {
    screen.remove(list)
    screen.render()
  })

  screen.append(list)
  list.focus()
  screen.render()
}
