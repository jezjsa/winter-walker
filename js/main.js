import { renderChangelog, CHANGELOG } from "./changelog.js";
import { renderFeatures } from "./features.js";
import { startWalk } from "./game.js";
import {
  adoptFieldRushIdentity,
  currentUser,
  leavePresence,
  playerName,
  refreshUser,
  requestLink,
  sendHeartbeat,
  signOut,
  verifyLink,
  watchLiveCount,
  watchLivePlayers,
  watchWalkScores,
} from "./social.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return "&#39;";
  });
}

function formatWhen(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function paintAccount() {
  const guest = document.getElementById("account-guest");
  const signed = document.getElementById("account-user");
  const nameEl = document.getElementById("account-name");
  const levelEl = document.getElementById("account-level");
  const user = currentUser();
  if (!user) {
    guest?.classList.remove("hidden");
    signed?.classList.add("hidden");
    return;
  }
  guest?.classList.add("hidden");
  signed?.classList.remove("hidden");
  if (nameEl) nameEl.textContent = user.name || user.email;
  if (levelEl) levelEl.textContent = user.level ? `Level ${user.level}` : user.email;
}

function paintOnline(rows) {
  const list = document.getElementById("online-list");
  const empty = document.getElementById("online-empty");
  if (!list) return;
  const you = playerName() || "You";
  const others = rows.filter((row) => !row.self);
  const mine = rows.find((row) => row.self);
  const shown = [
    { name: you, self: true, version: mine?.version },
    ...others,
  ];
  if (empty) empty.classList.add("hidden");
  list.innerHTML = shown.map((row) => `
    <li class="${row.self ? "online-you" : ""}">
      <span class="online-name">${escapeHtml(row.name)}</span>
    </li>
  `).join("");
}

function paintBoard(rows) {
  const body = document.getElementById("scoreboard-body");
  if (!body) return;
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="3">No scores yet. Walk first.</td></tr>`;
    return;
  }
  body.innerHTML = rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${formatWhen(row.createdAt)}</td>
    </tr>
  `).join("");
}

function paintNews() {
  const list = document.getElementById("news-list");
  if (!list) return;
  list.innerHTML = CHANGELOG.slice(0, 3).map((entry) => (
    `<li>${escapeHtml(entry.items[0])}</li>`
  )).join("");
}

function bindOverlay(openId, overlayId, closeId) {
  const overlay = document.getElementById(overlayId);
  document.getElementById(openId)?.addEventListener("click", () => overlay?.classList.remove("hidden"));
  document.getElementById(closeId)?.addEventListener("click", () => overlay?.classList.add("hidden"));
  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.classList.add("hidden");
  });
}

async function consumeAuth() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("auth");
  const note = document.getElementById("signup-status");
  if (token) {
    url.searchParams.delete("auth");
    history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    try {
      await verifyLink(token);
      if (note) note.textContent = "Signed in.";
    } catch (err) {
      if (note) {
        note.textContent = err instanceof Error ? err.message : "That sign-in link did not work.";
      }
    }
    paintAccount();
    return;
  }
  const shared = await adoptFieldRushIdentity();
  if (shared === undefined) return;
  if (!shared) await refreshUser();
  paintAccount();
}

document.getElementById("signup-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.getElementById("signup-email");
  const note = document.getElementById("signup-status");
  const button = document.getElementById("btn-signup");
  if (!(input instanceof HTMLInputElement) || !(button instanceof HTMLButtonElement)) return;
  button.disabled = true;
  if (note) note.textContent = "Sending link…";
  try {
    await requestLink(input.value.trim());
    if (note) note.textContent = "Check your email. Same Arcade Engage account as Field Rush.";
  } catch (err) {
    if (note) {
      note.textContent = err instanceof Error ? err.message : "Could not send the link.";
    }
  }
  button.disabled = false;
});

document.getElementById("btn-signout")?.addEventListener("click", async () => {
  await signOut();
  paintAccount();
  const note = document.getElementById("signup-status");
  if (note) note.textContent = "Signed out.";
});

bindOverlay("btn-changelog", "changelog-overlay", "btn-close-changelog");
bindOverlay("btn-features", "features-overlay", "btn-close-features");
renderChangelog(document.getElementById("changelog-body"));
renderFeatures(document.getElementById("features-body"));
paintNews();
paintAccount();
paintOnline([]);
paintBoard([]);

void consumeAuth().then(() => {
  paintAccount();
  void sendHeartbeat({ name: playerName() });
});

const onlineEl = document.getElementById("stat-online");
void watchLiveCount((count) => {
  if (onlineEl) onlineEl.textContent = String(Math.max(Number(count) || 0, 1));
});
void watchLivePlayers(paintOnline);
void watchWalkScores(paintBoard);

const heartbeat = setInterval(() => {
  if (document.visibilityState === "visible") void sendHeartbeat({ name: playerName() });
}, 8000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") void sendHeartbeat({ name: playerName() });
});
window.addEventListener("pagehide", () => {
  clearInterval(heartbeat);
  void leavePresence();
});

const canvas = document.getElementById("game");
if (canvas instanceof HTMLCanvasElement) {
  void startWalk(canvas).catch((err) => {
    console.error(err);
  });
}
