export const CHANGELOG = [
  {
    at: "2026-08-21T13:41:00+01:00",
    title: "Jump the snow",
    items: [
      "Space jumps. He crouches, leaves the ground, and lands on the same walk",
      "He stays in the middle of the screen — clouds, hills, and pines scroll past at different speeds",
    ],
  },
  {
    at: "2026-08-21T13:05:00+01:00",
    title: "First steps",
    items: [
      "Walk the snow with O left and P right. Same Arcade Engage sign-in as Field Rush and No Brakes",
      "Online list and scoreboard sit beside the walk — nothing to post yet, just the same account",
    ],
  },
];

export function renderChangelog(target) {
  if (!target) return;
  target.innerHTML = CHANGELOG.map((entry) => {
    const when = new Date(entry.at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `
      <article class="log-entry">
        <p class="log-when">${when}</p>
        <h3>${entry.title}</h3>
        <ul>${entry.items.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
    `;
  }).join("");
}
