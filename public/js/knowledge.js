/**
 * Knowledge Base & Notes Management JavaScript Logic
 */

let allNotes = [];

document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  setupNoteCreation();
  setupAiSummarize();
});

async function loadNotes() {
  const container = document.getElementById('notesListContainer');
  if (!container) return;

  const res = await apiFetch('/notes');
  if (res.success && res.notes) {
    allNotes = res.notes;
    renderNotes(allNotes);
  }
}

function renderNotes(notes) {
  const container = document.getElementById('notesListContainer');
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">No study notes found. Create your first note above!</div>';
    return;
  }

  container.innerHTML = notes.map(n => `
    <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1rem;box-shadow:var(--shadow-sm);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem;">
        <div>
          <span style="font-size:0.75rem;font-weight:700;padding:0.2rem 0.6rem;background:var(--primary-light);color:var(--primary);border-radius:var(--radius-sm);">${n.subject}</span>
          <h3 style="margin-top:0.4rem;font-size:1.2rem;">${n.title}</h3>
        </div>
        <button class="btn btn-secondary" onclick="deleteNote('${n.id}')" style="padding:0.3rem 0.6rem;font-size:0.8rem;color:var(--status-error);">Delete</button>
      </div>
      <div style="font-size:0.95rem;line-height:1.6;color:var(--text-main);margin-bottom:1rem;">
        ${formatNoteContent(n.content)}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:0.75rem;">
        <div style="display:flex;gap:0.4rem;">
          ${(n.tags || []).map(t => `<span style="font-size:0.75rem;color:var(--text-muted);background:var(--bg-surface-elevated);padding:0.1rem 0.5rem;border-radius:var(--radius-sm);">#${t}</span>`).join('')}
        </div>
        <button class="btn btn-secondary" onclick="aiSummarizeNote('${n.id}')" style="padding:0.4rem 0.8rem;font-size:0.85rem;">✨ AI Summarize</button>
      </div>
    </div>
  `).join('');
}

function setupNoteCreation() {
  const saveBtn = document.getElementById('saveNoteBtn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const title = document.getElementById('noteTitleInput')?.value.trim();
    const content = document.getElementById('noteContentInput')?.value.trim();
    const subject = document.getElementById('noteSubjectInput')?.value || 'General';
    const tags = document.getElementById('noteTagsInput')?.value || '';

    if (!title || !content) return showToast('Title and Content are required!', 'error');

    const res = await apiFetch('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, subject, content, tags })
    });

    if (res.success) {
      showToast('Note created successfully!');
      document.getElementById('noteTitleInput').value = '';
      document.getElementById('noteContentInput').value = '';
      loadNotes();
    }
  });
}

window.deleteNote = async function(id) {
  if (confirm('Are you sure you want to delete this study note?')) {
    await apiFetch(`/notes/${id}`, { method: 'DELETE' });
    showToast('Note deleted');
    loadNotes();
  }
};

window.aiSummarizeNote = async function(id) {
  const note = allNotes.find(n => n.id === id);
  if (!note) return;

  showToast('Study Mate AI summarizing note...', 'info');

  const res = await apiFetch('/notes/ai-summarize', {
    method: 'POST',
    body: JSON.stringify({ content: note.content, action: 'summarize' })
  });

  if (res.success && res.result) {
    alert(`✨ AI Note Summary:\n\n${res.result}`);
  }
};

function formatNoteContent(text) {
  if (!text) return '';
  return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
