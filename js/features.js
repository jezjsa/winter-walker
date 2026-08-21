export const FEATURES = [
  {
    title: "Walking",
    items: [
      "Hold O to walk left, P to walk right",
      "The walker stays on the snow and turns to face the way you are going",
      "Let go and they stand still",
    ],
  },
  {
    title: "This run only",
    items: [
      "No score yet — this build is just the walk",
    ],
  },
  {
    title: "Social / account",
    items: [
      "Same Arcade Engage magic-link account as Field Rush and No Brakes",
      "Online list is who is on this walk, by browser",
      "Scoreboard is live and empty until there is something to post",
    ],
  },
  {
    title: "UI",
    items: [
      "Winter sky, snow floor, and the walker in the middle",
      "Left rail: Online and Account",
      "Right rail: Back to Games, Game Features, Keys, News",
    ],
  },
];

export function renderFeatures(target) {
  if (!target) return;
  target.innerHTML = FEATURES.map((section) => `
    <article class="log-entry">
      <h3>${section.title}</h3>
      <ul>${section.items.map((item) => `<li>${item}</li>`).join("")}</ul>
    </article>
  `).join("");
}
