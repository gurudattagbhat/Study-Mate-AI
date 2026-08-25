/**
 * Progress & Analytics JavaScript Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  loadAnalytics();
});

async function loadAnalytics() {
  const res = await apiFetch('/analytics');
  if (res.success) {
    renderStats(res.userStats);
    renderBadges(res.badges);
  }
}

function renderStats(stats) {
  if (!stats) return;

  const streakEl = document.getElementById('analyticsStreakDisplay');
  if (streakEl) streakEl.textContent = stats.streak;

  const levelEl = document.getElementById('analyticsLevelDisplay');
  if (levelEl) levelEl.textContent = `Level ${stats.level}`;

  const expEl = document.getElementById('analyticsExpDisplay');
  if (expEl) expEl.textContent = `${stats.exp} EXP`;

  const cardsMastered = document.getElementById('analyticsCardsMastered');
  if (cardsMastered) cardsMastered.textContent = `${stats.masteredCards} / ${stats.totalCards}`;
}

function renderBadges(badges) {
  const container = document.getElementById('badgesGridContainer');
  if (!container || !badges) return;

  container.innerHTML = badges.map(b => `
    <div class="badge-card ${b.unlocked ? 'unlocked' : ''}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.title}</div>
      <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.3rem;">${b.description}</p>
      <span style="font-size:0.7rem;font-weight:700;margin-top:0.4rem;display:inline-block;${b.unlocked ? 'color:var(--accent-gold);' : 'color:var(--text-muted);'}">
        ${b.unlocked ? 'UNLOCKED ✨' : 'LOCKED 🔒'}
      </span>
    </div>
  `).join('');
}
