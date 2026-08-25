/**
 * Study Mate AI - Smart Planner & Schedule Manager JavaScript
 * Handles PDF (PDF.js), DOCX (Mammoth.js), Image OCR (Tesseract.js) Schedule Auto-Import
 * and Full Interactive User Creation for Timetable, Tasks & Academic Calendar
 */

let selectedScheduleFile = null;

document.addEventListener('DOMContentLoaded', () => {
  // Set default due date input to today + 5 days
  const today = new Date();
  const defaultDueDate = new Date(today.setDate(today.getDate() + 5)).toISOString().split('T')[0];
  const dueDateInput = document.getElementById('newTaskDueDateInput');
  const calDateInput = document.getElementById('newEventDateInput');
  if (dueDateInput) dueDateInput.value = defaultDueDate;
  if (calDateInput) calDateInput.value = defaultDueDate;

  setupScheduleUploader();
  loadTimetable();
  loadTasks();
  loadCalendarEvents();
  setupTaskCreation();
  setupTimetableCreation();
  setupCalendarCreation();
});

/* ==========================================================================
   1. AI SCHEDULE DOCUMENT & PHOTO UPLOADER (PDF, DOCX, OCR PHOTO)
   ========================================================================== */
function setupScheduleUploader() {
  const fileInput = document.getElementById('scheduleFileInput');
  const dropzone = document.getElementById('scheduleDropzone');
  const clearBtn = document.getElementById('clearScheduleFileBtn');
  const parseBtn = document.getElementById('parseScheduleBtn');

  if (!fileInput || !dropzone) return;

  // Drag & drop handlers
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--primary)';
      dropzone.style.background = 'var(--primary-light)';
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--primary-border)';
      dropzone.style.background = 'var(--bg-surface-elevated)';
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleSelectedScheduleFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectedScheduleFile(e.target.files[0]);
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      selectedScheduleFile = null;
      fileInput.value = '';
      document.getElementById('schedulePreviewCard')?.classList.add('hidden');
      document.getElementById('scheduleParseResultBox').innerHTML = '';
      showToast('Schedule file removed', 'info');
    });
  }

  if (parseBtn) {
    parseBtn.addEventListener('click', async () => {
      const textInput = document.getElementById('extractedScheduleTextStorage');
      const text = textInput ? textInput.value.trim() : '';

      if (!text) {
        return showToast('Please wait for text extraction or select a valid routine file!', 'error');
      }

      parseBtn.disabled = true;
      parseBtn.innerHTML = '⏳ Auto-Parsing with AI...';

      const res = await apiFetch('/tasks/ai-import-schedule', {
        method: 'POST',
        body: JSON.stringify({ extractedText: text })
      });

      parseBtn.disabled = false;
      parseBtn.innerHTML = '⚡ Import Schedule with Study Mate AI';

      if (res.success) {
        showToast('Schedule imported successfully!');
        const resultBox = document.getElementById('scheduleParseResultBox');
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="padding:1rem;background:var(--primary-light);border:1px solid var(--primary-border);border-radius:var(--radius-md);color:var(--primary);font-weight:600;">
              ✨ Study Mate AI imported ${res.data.timetable ? res.data.timetable.length : 0} timetable slots, ${res.data.todos ? res.data.todos.length : 0} tasks, and ${res.data.calendar ? res.data.calendar.length : 0} exam events!
            </div>
          `;
        }
        // Reload all sections
        loadTimetable();
        loadTasks();
        loadCalendarEvents();
      } else {
        showToast(res.message || 'Error importing schedule', 'error');
      }
    });
  }
}

async function handleSelectedScheduleFile(file) {
  selectedScheduleFile = file;
  const card = document.getElementById('schedulePreviewCard');
  const nameDisplay = document.getElementById('scheduleFileNameDisplay');
  const sizeDisplay = document.getElementById('scheduleFileSizeDisplay');

  if (card && nameDisplay && sizeDisplay) {
    nameDisplay.textContent = file.name;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    sizeDisplay.textContent = `${sizeMb} MB • Extracting schedule content...`;
    card.classList.remove('hidden');
  }

  showToast(`Extracting readable text from ${file.name}...`, 'info');

  let extractedText = '';
  const fileExt = file.name.split('.').pop().toLowerCase();

  try {
    if (fileExt === 'pdf') {
      extractedText = await extractTextFromPdf(file);
    } else if (fileExt === 'docx' || fileExt === 'doc') {
      extractedText = await extractTextFromDocx(file);
    } else if (['png', 'jpg', 'jpeg', 'webp'].includes(fileExt)) {
      extractedText = await extractTextFromImageOcr(file);
    } else {
      extractedText = await file.text();
    }

    // Save extracted text in a hidden storage element
    let hiddenStorage = document.getElementById('extractedScheduleTextStorage');
    if (!hiddenStorage) {
      hiddenStorage = document.createElement('textarea');
      hiddenStorage.id = 'extractedScheduleTextStorage';
      hiddenStorage.style.display = 'none';
      document.body.appendChild(hiddenStorage);
    }
    hiddenStorage.value = extractedText;

    sizeDisplay.textContent = `${(file.size / 1024).toFixed(1)} KB • Extracted ${extractedText.length} characters cleanly! Ready for AI Import.`;
    showToast('Text extracted! Click "Import Schedule with Study Mate AI" below.', 'success');
  } catch (err) {
    console.error('Text extraction error:', err);
    sizeDisplay.textContent = 'Error extracting text. You can still proceed with AI import.';
    showToast('Failed to extract text automatically.', 'error');
  }
}

// PDF Text Extractor using PDF.js
async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textObj = await page.getTextContent();
    const pageText = textObj.items.map(item => item.str).join(' ');
    textContent += `\n--- Page ${i} ---\n` + pageText;
  }
  return textContent.trim();
}

// DOCX Text Extractor using Mammoth.js
async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value ? result.value.trim() : '';
}

// Image OCR Text Extractor using Tesseract.js
async function extractTextFromImageOcr(file) {
  showToast('Running Tesseract OCR scanner on schedule image...', 'info');
  const result = await Tesseract.recognize(file, 'eng', {
    logger: m => console.log(m)
  });
  return result.data.text ? result.data.text.trim() : '';
}

/* ==========================================================================
   2. INTERACTIVE TIMETABLE MATRIX MANAGER
   ========================================================================== */
async function loadTimetable() {
  const container = document.getElementById('timetableGridContainer');
  if (!container) return;

  const res = await apiFetch('/tasks/timetable');
  if (res.success && res.timetable) {
    if (res.timetable.length === 0) {
      container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">No timetable slots added yet. Click "➕ Add Custom Class Slot" above or upload a Routine PDF!</div>';
      return;
    }

    container.innerHTML = `
      <table style="width:100%;border-collapse:collapse;text-align:left;">
        <thead>
          <tr style="background:var(--bg-surface-elevated);border-bottom:2px solid var(--border-color);">
            <th style="padding:0.75rem 1rem;">Day</th>
            <th style="padding:0.75rem 1rem;">Time Slot</th>
            <th style="padding:0.75rem 1rem;">Course / Subject</th>
            <th style="padding:0.75rem 1rem;">Room / Location</th>
            <th style="padding:0.75rem 1rem;text-align:right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${res.timetable.map((row, idx) => `
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.75rem 1rem;font-weight:700;color:var(--primary);">${row.day}</td>
              <td style="padding:0.75rem 1rem;color:var(--text-muted);">${row.time}</td>
              <td style="padding:0.75rem 1rem;font-weight:600;">${row.subject}</td>
              <td style="padding:0.75rem 1rem;"><span style="padding:0.2rem 0.6rem;background:var(--primary-light);color:var(--primary);border-radius:var(--radius-sm);font-size:0.85rem;font-weight:600;">${row.room}</span></td>
              <td style="padding:0.75rem 1rem;text-align:right;">
                <button onclick="deleteTimetableSlot(${idx})" class="btn btn-secondary" style="padding:0.25rem 0.55rem;font-size:0.8rem;color:var(--accent-rose);border-color:var(--border-color);" title="Delete Slot">✕ Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

window.toggleTimetableAddForm = function() {
  const form = document.getElementById('addTimetableSlotForm');
  if (form) form.classList.toggle('hidden');
};

function setupTimetableCreation() {
  const saveBtn = document.getElementById('saveTimetableSlotBtn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const day = document.getElementById('slotDaySelect')?.value || 'Monday';
    const time = document.getElementById('slotTimeInput')?.value.trim() || '09:00 AM - 10:30 AM';
    const subject = document.getElementById('slotSubjectInput')?.value.trim();
    const room = document.getElementById('slotRoomInput')?.value.trim() || 'LH-101';

    if (!subject) return showToast('Please enter Subject / Course Name!', 'error');

    const res = await apiFetch('/tasks/timetable', {
      method: 'POST',
      body: JSON.stringify({ day, time, subject, room })
    });

    if (res.success) {
      showToast('Timetable slot added!');
      document.getElementById('slotSubjectInput').value = '';
      toggleTimetableAddForm();
      loadTimetable();
    }
  });
}

window.deleteTimetableSlot = async function(index) {
  if (confirm('Delete this timetable slot?')) {
    await apiFetch(`/tasks/timetable/${index}`, { method: 'DELETE' });
    showToast('Slot deleted');
    loadTimetable();
  }
};

/* ==========================================================================
   3. INTERACTIVE TASKS & TODO MANAGER
   ========================================================================== */
async function loadTasks() {
  const todoList = document.getElementById('todoListContainer');
  const assignmentList = document.getElementById('assignmentListContainer');

  if (!todoList && !assignmentList) return;

  const res = await apiFetch('/tasks');
  if (res.success && res.tasks) {
    const todos = res.tasks.filter(t => t.type === 'todo');
    const assignments = res.tasks.filter(t => t.type === 'assignment');

    if (todoList) {
      todoList.innerHTML = todos.length === 0 ? '<p style="color:var(--text-muted);padding:1rem 0;">No pending tasks! Add one above.</p>' : todos.map(t => `
        <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1rem;margin-bottom:0.75rem;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow-sm);">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskDone('${t.id}')" style="width:18px;height:18px;cursor:pointer;">
            <div>
              <h4 style="font-size:0.95rem;${t.completed ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${t.title}</h4>
              <p style="font-size:0.8rem;color:var(--text-muted);">${t.subject} • Due ${t.dueDate}</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <span style="padding:0.2rem 0.6rem;border-radius:var(--radius-full);font-size:0.75rem;font-weight:700;${t.priority === 'high' ? 'background:var(--accent-rose-light);color:var(--accent-rose);' : 'background:var(--primary-light);color:var(--primary);'}">${t.priority.toUpperCase()}</span>
            <button onclick="deleteTask('${t.id}')" style="background:none;border:none;color:var(--accent-rose);cursor:pointer;font-size:0.9rem;" title="Delete Task">🗑️</button>
          </div>
        </div>
      `).join('');
    }

    if (assignmentList) {
      assignmentList.innerHTML = assignments.length === 0 ? '<p style="color:var(--text-muted);padding:1rem 0;">No upcoming assignments! Add one above.</p>' : assignments.map(a => `
        <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1rem;margin-bottom:0.75rem;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow-sm);">
          <div>
            <h4 style="font-size:0.95rem;">${a.title}</h4>
            <p style="font-size:0.8rem;color:var(--text-muted);">${a.subject} • Weightage: ${a.weightage || '10%'}</p>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="text-align:right;">
              <div style="font-size:0.75rem;color:var(--accent-gold);font-weight:700;">Deadline</div>
              <div style="font-size:0.85rem;font-weight:600;">${a.dueDate}</div>
            </div>
            <button onclick="deleteTask('${a.id}')" style="background:none;border:none;color:var(--accent-rose);cursor:pointer;font-size:0.9rem;" title="Delete Assignment">🗑️</button>
          </div>
        </div>
      `).join('');
    }
  }
}

function setupTaskCreation() {
  const addBtn = document.getElementById('addNewTaskBtn');
  if (!addBtn) return;

  addBtn.addEventListener('click', async () => {
    const title = document.getElementById('newTaskTitleInput')?.value.trim();
    if (!title) return showToast('Please enter task title!', 'error');

    const dueDateVal = document.getElementById('newTaskDueDateInput')?.value || new Date().toISOString().split('T')[0];

    const res = await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        subject: document.getElementById('newTaskSubjectInput')?.value || 'General',
        type: document.getElementById('newTaskTypeSelect')?.value || 'todo',
        dueDate: dueDateVal,
        priority: document.getElementById('newTaskPrioritySelect')?.value || 'medium'
      })
    });

    if (res.success) {
      showToast('Task added successfully!');
      document.getElementById('newTaskTitleInput').value = '';
      document.getElementById('newTaskSubjectInput').value = '';
      loadTasks();
    }
  });
}

window.toggleTaskDone = async function(id) {
  await apiFetch(`/tasks/${id}/toggle`, { method: 'PATCH' });
  loadTasks();
};

window.deleteTask = async function(id) {
  if (confirm('Delete this item?')) {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    showToast('Task deleted');
    loadTasks();
  }
};

/* ==========================================================================
   4. INTERACTIVE ACADEMIC CALENDAR MANAGER
   ========================================================================== */
async function loadCalendarEvents() {
  const container = document.getElementById('academicCalendarContainer');
  if (!container) return;

  const res = await apiFetch('/tasks/calendar');
  if (res.success && res.calendar) {
    const events = res.calendar;
    if (events.length === 0) {
      container.innerHTML = '<div style="padding:1.5rem;text-align:center;color:var(--text-muted);">No calendar events. Click "➕ Add Calendar Event" above to create exam or deadline reminders!</div>';
      return;
    }

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">
        <h3 style="color:var(--text-main);font-size:1.1rem;">🗓️ Upcoming Academic Deadlines & Exam Dates</h3>
        <span style="padding:0.35rem 0.85rem;background:var(--primary-light);color:var(--primary);border-radius:var(--radius-full);font-weight:700;font-size:0.85rem;">Total Events: ${events.length} ⚡</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${events.map(e => `
          <div style="background:var(--bg-surface-elevated);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:0.85rem 1.1rem;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <span style="font-size:1.3rem;">${e.type === 'exam' ? '🎓' : (e.type === 'assignment' ? '📝' : '🎉')}</span>
              <div>
                <div style="font-weight:700;font-size:0.95rem;color:var(--text-main);">${e.title}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);">Category: ${e.type ? e.type.toUpperCase() : 'EVENT'}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:1rem;">
              <div style="text-align:right;">
                <div style="font-size:0.75rem;color:var(--accent-gold);font-weight:700;">Date</div>
                <div style="font-weight:700;font-size:0.9rem;color:var(--primary);">${e.date}</div>
              </div>
              <button onclick="deleteCalendarEvent('${e.id}')" class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;color:var(--accent-rose);" title="Delete Event">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

window.toggleCalendarAddForm = function() {
  const form = document.getElementById('addCalendarEventForm');
  if (form) form.classList.toggle('hidden');
};

function setupCalendarCreation() {
  const saveBtn = document.getElementById('saveCalendarEventBtn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const title = document.getElementById('newEventTitleInput')?.value.trim();
    if (!title) return showToast('Please enter Event Title!', 'error');

    const date = document.getElementById('newEventDateInput')?.value || new Date().toISOString().split('T')[0];
    const type = document.getElementById('newEventTypeSelect')?.value || 'exam';

    const res = await apiFetch('/tasks/calendar', {
      method: 'POST',
      body: JSON.stringify({ title, date, type })
    });

    if (res.success) {
      showToast('Calendar event added!');
      document.getElementById('newEventTitleInput').value = '';
      toggleCalendarAddForm();
      loadCalendarEvents();
    }
  });
}

window.deleteCalendarEvent = async function(id) {
  if (confirm('Delete this calendar event?')) {
    await apiFetch(`/tasks/calendar/${id}`, { method: 'DELETE' });
    showToast('Event deleted');
    loadCalendarEvents();
  }
};
