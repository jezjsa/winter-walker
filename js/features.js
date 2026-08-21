export const FEATURES = [
  {
    title: "Walking",
    items: [
      "Hold O to walk left, P to walk right",
      "The walker stays in the middle of the screen. The winter path scrolls past",
      "Let go and they finish the step, then stand still",
    ],
  },
  {
    title: "Jumping",
    items: [
      "Space jumps. You can keep walking left or right in the air",
      "He has to land before he can jump again",
    ],
  },
  {
    title: "This run only",
    items: [
      "No score yet — this build is the walk and the jump",
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
      "Parallax winter sky, hills, pines, and snow, with the walker in the middle",
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
