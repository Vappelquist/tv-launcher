// Clock widget: big time, date underneath. Uses the system locale.

export function mount(el) {
  const time = document.createElement("div");
  time.className = "clock-time";
  const date = document.createElement("div");
  date.className = "clock-date";
  el.append(time, date);

  const timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "long", day: "numeric", month: "long",
  });

  function tick() {
    const now = new Date();
    time.textContent = timeFmt.format(now);
    date.textContent = dateFmt.format(now);
  }
  tick();
  setInterval(tick, 1000);
  return {};
}
