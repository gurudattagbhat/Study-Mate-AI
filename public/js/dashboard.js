/**
 * Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  loadDashboardData();
});

async function loadDashboardData() {
  const [analyticsRes, notesRes, tasksRes] = await Promise.all([
    apiFetch('/analytics'),
    apiFetch('/notes'),
    apiFetch('/tasks')
  ]);

  if (analyticsRes.success && analyticsRes.userStats) {
    const stats = analyticsRes.userStats;
    
    const streakEl = document.getElementById('dashStreak');
    if (streakEl) streakEl.textContent = stats.streak;

    const levelEl = document.getElementById('dashLevel');
    if (levelEl) levelEl.textContent = `Lvl ${stats.level}`;

    const expEl = document.getElementById('dashExp');
    if (expEl) expEl.textContent = `${stats.exp} EXP`;

    const notesCount = document.getElementById('dashNotesCount');
    if (notesCount) notesCount.textContent = stats.totalNotes || notesRes.notes?.length || 0;

    const pendingTasks = document.getElementById('dashPendingTasks');
    if (pendingTasks) pendingTasks.textContent = stats.pendingTasks || tasksRes.tasks?.filter(t => !t.completed).length || 0;
  }
}
