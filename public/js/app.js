/**
 * Study Mate AI - Shared Application Scripts, Toast Manager & Rich Markdown Renderer
 * Synchronous Zero-Flicker Header Navigation & Profile Dropdown Engine
 */

const API_BASE = '/api';

// Rich Markdown to Clean HTML Formatter Engine
function formatMarkdownToHtml(text) {
  if (!text) return '';

  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  cleaned = cleaned
    .replace(/^### (.*$)/gim, '<h3 style="color:var(--primary);margin-top:1.2rem;margin-bottom:0.5rem;font-size:1.15rem;font-weight:700;">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 style="margin-top:0.9rem;margin-bottom:0.4rem;font-size:1.02rem;color:var(--text-main);font-weight:600;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h2 style="color:var(--primary);margin-top:1.4rem;margin-bottom:0.6rem;font-size:1.25rem;">$1</h2>');

  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  cleaned = cleaned
    .replace(/```([\s\S]*?)```/g, '<pre style="background:var(--bg-surface-elevated);border:1px solid var(--border-color);padding:0.9rem;border-radius:var(--radius-md);overflow-x:auto;margin:0.8rem 0;font-family:monospace;font-size:0.88rem;color:var(--text-main);"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--bg-surface-elevated);border:1px solid var(--border-color);padding:0.15rem 0.4rem;border-radius:4px;font-family:monospace;font-size:0.88rem;color:var(--accent-rose);">$1</code>');

  cleaned = cleaned.replace(/^\s*[-•*]\s+(.*$)/gim, '<li style="margin-bottom:0.35rem;">$1</li>');
  cleaned = cleaned.replace(/(<li style="margin-bottom:0.35rem;">.*<\/li>\n?)+/g, '<ul style="padding-left:1.3rem;margin-bottom:0.9rem;line-height:1.6;">$&</ul>');

  cleaned = cleaned.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li style="margin-bottom:0.35rem;"><span style="font-weight:700;color:var(--primary);">$1.</span> $2</li>');

  cleaned = cleaned.replace(/\n\n/g, '<br><br>');

  return `<div class="ai-output-content">${cleaned}</div>`;
}

// Toast Notification Helper
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
  
  toast.innerHTML = `
    <span style="font-size:1.2rem;">${icon}</span>
    <span style="font-weight:500;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Toggle Helper
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// Mobile Navbar Hamburger Toggle
window.toggleMobileMenu = function () {
  const navMenu = document.querySelector('.nav-menu');
  if (!navMenu) return;
  
  const isOpen = navMenu.classList.toggle('mobile-open');

  if (isOpen) {
    // Close menu when clicking outside
    const closeOnOutsideClick = (e) => {
      if (!navMenu.contains(e.target) && !e.target.closest('.mobile-menu-btn')) {
        navMenu.classList.remove('mobile-open');
        document.removeEventListener('click', closeOnOutsideClick);
      }
    };
    setTimeout(() => document.addEventListener('click', closeOnOutsideClick), 50);

    // Close menu when clicking any nav link
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
      }, { once: true });
    });
  }
};

// Fetch helper with Authorization token
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('studymate_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: 'Network or server communication error.' };
  }
}

// Highlight Active Nav Link
function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-menu .nav-item a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// User Profile Dropdown Toggle Handler
window.toggleUserDropdown = function(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('userProfileDropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
};

// Handle Log Out Action from Profile Dropdown
window.handleUserLogout = function() {
  localStorage.removeItem('studymate_token');
  localStorage.removeItem('studymate_user_cache');
  showToast('Logged out successfully');
  setTimeout(() => window.location.href = 'login.html', 300);
};

// Real Dynamic Notification Aggregator Engine (100% Dynamic User Tasks, Calendar Exams, and Reminders)
async function loadRealUserNotifications() {
  const realNotifications = [];

  try {
    // 1. Fetch Real User Tasks & Todo Deadlines
    const tasksRes = await apiFetch('/tasks');
    if (tasksRes && tasksRes.success && Array.isArray(tasksRes.tasks)) {
      tasksRes.tasks.forEach((t, i) => {
        if (!t.completed) {
          realNotifications.push({
            id: `notif-task-${t.id || i}`,
            icon: '📝',
            title: `Todo Deadline: ${t.title || 'Study Task'}`,
            desc: `${t.subject ? t.subject + ' • ' : ''}Due: ${t.dueDate || 'Soon'} • Priority: ${(t.priority || 'Medium').toUpperCase()}`,
            time: 'Active Deadline',
            link: 'planner.html#todo',
            read: false
          });
        }
      });
    }

    // 2. Fetch Real Academic Calendar & Exam Dates
    const calRes = await apiFetch('/tasks/calendar');
    if (calRes && calRes.success && Array.isArray(calRes.calendar)) {
      calRes.calendar.forEach((e, i) => {
        realNotifications.push({
          id: `notif-cal-${e.id || i}`,
          icon: '📌',
          title: `Exam / Event Alert: ${e.title || 'Academic Event'}`,
          desc: `Date: ${e.date || 'Upcoming'} • Category: ${(e.type || 'Exam').toUpperCase()}`,
          time: 'Upcoming Event',
          link: 'planner.html#calendar',
          read: false
        });
      });
    }

    // 3. Fetch Real Study Session Reminders
    const remRes = await apiFetch('/tasks/reminders');
    if (remRes && remRes.success && Array.isArray(remRes.reminders)) {
      remRes.reminders.forEach((r, i) => {
        if (r.active !== false) {
          realNotifications.push({
            id: `notif-rem-${r.id || i}`,
            icon: '⏰',
            title: `Study Session Alert: ${r.title || 'Timer Alert'}`,
            desc: `Scheduled Time: ${r.time || 'Today'}`,
            time: 'Scheduled Alert',
            link: 'planner.html#timetable',
            read: false
          });
        }
      });
    }

    // 4. Check Flashcard Decks
    const fcRes = await apiFetch('/quizzes/flashcards');
    if (fcRes && fcRes.success && Array.isArray(fcRes.flashcards) && fcRes.flashcards.length > 0) {
      realNotifications.push({
        id: 'notif-fc-active',
        icon: '🎴',
        title: 'Flashcards Review Deck',
        desc: `You have ${fcRes.flashcards.length} interactive study cards ready for active recall`,
        time: 'Active Deck',
        link: 'practice.html#flashcards',
        read: false
      });
    }

  } catch (err) {
    console.error('Error loading real user notifications:', err);
  }

  // Merge read state from localStorage
  const readStateRaw = localStorage.getItem('studymate_read_notifications');
  let readIds = [];
  try { if (readStateRaw) readIds = JSON.parse(readStateRaw); } catch(e){}

  realNotifications.forEach(n => {
    if (readIds.includes(n.id)) {
      n.read = true;
    }
  });

  return realNotifications;
}

window.toggleNotificationCenter = async function(e) {
  if (e) e.stopPropagation();
  const drawer = document.getElementById('notificationCenterDrawer');
  const userDropdown = document.getElementById('userProfileDropdown');
  if (userDropdown) userDropdown.classList.add('hidden');
  
  if (drawer) {
    const isOpening = drawer.classList.contains('hidden');
    drawer.classList.toggle('hidden');
    
    if (isOpening) {
      // Mark all notifications as read when opening notification drawer
      const notifications = await loadRealUserNotifications();
      const readIds = notifications.map(n => n.id);
      localStorage.setItem('studymate_read_notifications', JSON.stringify(readIds));

      const dot = document.getElementById('navNotificationDot');
      if (dot) dot.style.display = 'none';
    }
    renderNotificationCenter();
  }
};

window.handleNotificationClick = function(id, targetLink) {
  const readStateRaw = localStorage.getItem('studymate_read_notifications');
  let readIds = [];
  try { if (readStateRaw) readIds = JSON.parse(readStateRaw); } catch(e){}
  if (!readIds.includes(id)) {
    readIds.push(id);
    localStorage.setItem('studymate_read_notifications', JSON.stringify(readIds));
  }

  const drawer = document.getElementById('notificationCenterDrawer');
  if (drawer) drawer.classList.add('hidden');
  
  if (targetLink) {
    window.location.href = targetLink;
  }
};

window.markAllNotificationsRead = async function(e) {
  if (e) e.stopPropagation();
  const notifications = await loadRealUserNotifications();
  const readIds = notifications.map(n => n.id);
  localStorage.setItem('studymate_read_notifications', JSON.stringify(readIds));
  
  const dot = document.getElementById('navNotificationDot');
  if (dot) dot.style.display = 'none';

  renderNotificationCenter();
  showToast('All notifications marked as read', 'info');
};

async function renderNotificationCenter() {
  const itemsList = document.getElementById('notificationItemsList');
  const dot = document.getElementById('navNotificationDot');
  const notifications = await loadRealUserNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  if (dot) {
    if (unreadCount > 0) {
      dot.style.display = 'block';
    } else {
      dot.style.display = 'none';
    }
  }

  if (itemsList) {
    if (notifications.length === 0) {
      itemsList.innerHTML = `
        <div style="padding:2.5rem 1.5rem;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;">✨</div>
          <strong style="display:block;font-size:0.95rem;color:var(--text-main);margin-bottom:0.4rem;">No Active Task Notifications!</strong>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem;">Add tasks or import your schedule routine in Smart Planner to see live alerts here.</p>
          <a href="planner.html" class="btn btn-primary" style="padding:0.45rem 1rem;font-size:0.85rem;">🗓️ Open Smart Planner</a>
        </div>
      `;
      return;
    }

    itemsList.innerHTML = notifications.map(item => `
      <div onclick="handleNotificationClick('${item.id}', '${item.link}')" style="padding:0.75rem 1rem;display:flex;gap:0.75rem;align-items:flex-start;cursor:pointer;border-bottom:1px solid var(--border-color);background:${item.read ? 'transparent' : 'var(--primary-light)'};transition:background 0.2s;" onmouseover="this.style.background='var(--bg-surface-elevated)'" onmouseout="this.style.background='${item.read ? 'transparent' : 'var(--primary-light)'}'">
        <div style="font-size:1.4rem;line-height:1;margin-top:0.1rem;">${item.icon}</div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
            <strong style="font-size:0.86rem;color:${item.read ? 'var(--text-main)' : 'var(--primary)'};">${item.title}</strong>
            <span style="font-size:0.72rem;color:var(--text-muted);">${item.time}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-muted);line-height:1.4;">${item.desc}</div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--primary);margin-top:0.3rem;display:inline-flex;align-items:center;gap:0.2rem;">Go to feature →</div>
        </div>
        ${!item.read ? `<div style="width:8px;height:8px;border-radius:50%;background:var(--accent-rose);margin-top:0.4rem;flex-shrink:0;"></div>` : ''}
      </div>
    `).join('');
  }
}

// Close Profile & Notification Dropdowns when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userProfileDropdown');
  const wrapper = document.getElementById('userChipWrapper');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (!wrapper || !wrapper.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  }

  const drawer = document.getElementById('notificationCenterDrawer');
  const navWrapper = document.getElementById('navNotificationWrapper');
  if (drawer && !drawer.classList.contains('hidden')) {
    if (!navWrapper || !navWrapper.contains(e.target)) {
      drawer.classList.add('hidden');
    }
  }
});

// Synchronous Zero-Flicker Header & Hero Actions Renderer
function renderHeaderSync() {
  highlightActiveNavLink();

  const token = localStorage.getItem('studymate_token');
  const navActionsContainer = document.querySelector('.nav-actions');
  const heroActionBtns = document.getElementById('heroActionBtns');
  const sectionHeaderAuthBtns = document.getElementById('sectionHeaderAuthBtns');

  const cachedUserRaw = localStorage.getItem('studymate_user_cache');
  let user = null;
  try { if (cachedUserRaw) user = JSON.parse(cachedUserRaw); } catch(e) {}

  if (token) {
    // 1. ALWAYS HIDE all Log In & Sign Up buttons anywhere in header or main page!
    const authLinks = document.querySelectorAll(
      'a[href*="login"], a[href*="signup"], .btn[href*="login"], .btn[href*="signup"]'
    );
    authLinks.forEach(link => {
      if (!link.closest('#userProfileDropdown') && !link.closest('.auth-form-col')) {
        link.style.setProperty('display', 'none', 'important');
      }
    });

    if (sectionHeaderAuthBtns) {
      sectionHeaderAuthBtns.style.setProperty('display', 'none', 'important');
    }

    // 2. Update Landing Page Hero Action Buttons when logged in
    if (heroActionBtns) {
      heroActionBtns.innerHTML = `
        <a href="ai-suite.html" class="btn btn-primary" style="padding:0.75rem 1.6rem;font-size:1rem;">🤖 Open AI Suite</a>
        <a href="planner.html" class="btn btn-secondary" style="padding:0.75rem 1.6rem;font-size:1rem;">🗓️ View Smart Planner</a>
        <a href="practice.html" class="btn btn-secondary" style="padding:0.75rem 1.6rem;font-size:1rem;">🎴 Practice Flashcards</a>
      `;
    }

    // 3. Build Notification Bell & Interactive Profile Dropdown Menu in Navbar
    if (navActionsContainer) {
      let notifWrapper = document.getElementById('navNotificationWrapper');
      if (!notifWrapper) {
        notifWrapper = document.createElement('div');
        notifWrapper.id = 'navNotificationWrapper';
        notifWrapper.style.position = 'relative';
        notifWrapper.style.display = 'inline-block';

        notifWrapper.innerHTML = `
          <button id="navNotificationBellBtn" onclick="toggleNotificationCenter(event)" style="background:var(--bg-surface-elevated);border:1px solid var(--border-color);border-radius:var(--radius-full);width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-main);font-size:1.1rem;position:relative;transition:all 0.2s;" title="Notifications & Study Alerts">
            🔔
            <span id="navNotificationDot" style="position:absolute;top:6px;right:6px;background:var(--accent-rose);border-radius:50%;width:10px;height:10px;border:2px solid var(--bg-surface-elevated);display:none;box-shadow:0 0 6px var(--accent-rose);"></span>
          </button>

          <div id="notificationCenterDrawer" class="hidden" style="position:absolute;right:0;top:calc(100% + 10px);width:350px;background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);z-index:9999;overflow:hidden;">
            <div style="padding:0.9rem 1.1rem;border-bottom:1px solid var(--border-color);background:var(--bg-surface-elevated);display:flex;justify-content:space-between;align-items:center;">
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <span style="font-size:1.1rem;">🔔</span>
                <strong style="font-size:0.92rem;color:var(--text-main);">Notifications & Study Alerts</strong>
              </div>
              <button onclick="markAllNotificationsRead(event)" style="background:none;border:none;color:var(--primary);font-size:0.78rem;font-weight:700;cursor:pointer;">Mark all read</button>
            </div>

            <div id="notificationItemsList" style="max-height:360px;overflow-y:auto;padding:0.2rem 0;"></div>

            <div style="padding:0.6rem;border-top:1px solid var(--border-color);background:var(--bg-surface-elevated);text-align:center;">
              <a href="planner.html#calendar" style="font-size:0.82rem;font-weight:700;color:var(--primary);text-decoration:none;">🗓️ View Full Smart Planner Schedule →</a>
            </div>
          </div>
        `;
        navActionsContainer.insertBefore(notifWrapper, navActionsContainer.firstChild);
      }
      renderNotificationCenter();

      let wrapper = document.getElementById('userChipWrapper');
      
      const userName = (user && user.name) ? user.name.trim() : 'Student';
      const firstName = userName.split(' ')[0];
      const nameParts = userName.split(/\s+/);
      const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() 
        : nameParts[0][0].toUpperCase();

      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'userChipWrapper';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';

        wrapper.innerHTML = `
          <button id="userDropdownToggleBtn" onclick="toggleUserDropdown(event)" class="user-chip" style="display:flex;align-items:center;gap:0.55rem;background:var(--bg-surface-elevated);border:1px solid var(--border-color);border-radius:var(--radius-full);padding:0.35rem 0.85rem;cursor:pointer;color:var(--text-main);font-family:inherit;font-size:0.9rem;transition:border-color 0.2s;">
            <div class="user-avatar" id="navAvatar">${initials}</div>
            <span id="navUserName" style="font-weight:600;">${firstName}</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">▼</span>
          </button>

          <div id="userProfileDropdown" class="user-profile-dropdown hidden" style="position:absolute;right:0;top:calc(100% + 8px);width:220px;background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);z-index:2000;overflow:hidden;padding:0.4rem 0;">
            <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--border-color);background:var(--bg-surface-elevated);">
              <div style="font-weight:700;font-size:0.9rem;color:var(--text-main);">${userName}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);">${(user && user.email) ? user.email : 'student@studymate.ai'}</div>
            </div>
            <a href="settings.html" style="display:flex;align-items:center;gap:0.65rem;padding:0.65rem 1rem;color:var(--text-main);font-weight:600;font-size:0.9rem;text-decoration:none;transition:background 0.2s;" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background='transparent'">
              <span>👤</span> Profile & Security Settings
            </a>
            <div style="border-top:1px solid var(--border-color);margin:0.25rem 0;"></div>
            <button onclick="handleUserLogout()" style="width:100%;text-align:left;background:none;border:none;display:flex;align-items:center;gap:0.65rem;padding:0.65rem 1rem;color:var(--accent-rose);font-weight:600;font-size:0.9rem;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background='transparent'">
              <span>🚪</span> Log Out
            </button>
          </div>
        `;
        navActionsContainer.appendChild(wrapper);
      } else {
        const nameEl = document.getElementById('navUserName');
        const avatarEl = document.getElementById('navAvatar');
        if (nameEl) nameEl.textContent = firstName;
        if (avatarEl) avatarEl.textContent = initials;
      }

      const oldChip = navActionsContainer.querySelector('.user-chip:not(#userDropdownToggleBtn)');
      if (oldChip) oldChip.style.display = 'none';
      const oldLogout = document.getElementById('logoutBtn');
      if (oldLogout) oldLogout.remove();
    }
  } else {
    // Show Login & Signup buttons when logged out
    const authLinks = document.querySelectorAll(
      '.site-header a[href*="login"], .site-header a[href*="signup"], .nav-actions a[href*="login"], .nav-actions a[href*="signup"]'
    );
    authLinks.forEach(link => {
      link.style.setProperty('display', 'inline-flex', 'important');
    });

    if (sectionHeaderAuthBtns) {
      sectionHeaderAuthBtns.style.setProperty('display', 'flex', 'important');
    }

    if (heroActionBtns) {
      heroActionBtns.innerHTML = `
        <a href="login.html" class="btn btn-primary" style="padding:0.75rem 1.6rem;font-size:1rem;">🔑 Log In to Account</a>
        <a href="signup.html" class="btn btn-secondary" style="padding:0.75rem 1.6rem;font-size:1rem;">✨ Sign Up Free</a>
        <a href="ai-suite.html" class="btn btn-secondary" style="padding:0.75rem 1.6rem;font-size:1rem;">🤖 Try AI Tutor</a>
      `;
    }

    const wrapper = document.getElementById('userChipWrapper');
    if (wrapper) wrapper.remove();
  }
}

// Background Profile Refresher
async function refreshUserProfile() {
  const token = localStorage.getItem('studymate_token');
  if (!token) return;

  const res = await apiFetch('/auth/profile');
  if (res.success && res.user) {
    localStorage.setItem('studymate_user_cache', JSON.stringify(res.user));
    
    const userName = res.user.name.trim();
    const firstName = userName.split(' ')[0];
    const nameParts = userName.split(/\s+/);
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() 
      : nameParts[0][0].toUpperCase();

    const nameEl = document.getElementById('navUserName');
    const avatarEl = document.getElementById('navAvatar');

    if (nameEl) nameEl.textContent = firstName;
    if (avatarEl) avatarEl.textContent = initials;
  }
}

// Single Feature Focus Mode (Tabbed View per Sub-Navbar Click)
function setupSubNavFocusMode() {
  const subNavbar = document.querySelector('.sub-navbar');
  if (!subNavbar) return;

  const subNavItems = subNavbar.querySelectorAll('.sub-nav-item');
  if (!subNavItems || subNavItems.length === 0) return;

  const sections = document.querySelectorAll('main section[id]');
  if (!sections || sections.length === 0) return;

  function applyFocus() {
    let hash = window.location.hash.trim().toLowerCase();

    // If no hash is specified in URL, default to the first feature section ID
    if (!hash || hash === '#') {
      const firstSectionId = sections[0].id;
      if (firstSectionId) {
        hash = '#' + firstSectionId;
      }
    }

    if (hash === '#all') {
      sections.forEach(sec => {
        sec.style.display = 'block';
      });
      subNavItems.forEach(item => {
        if (item.getAttribute('href') === '#all') {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      return;
    }

    const targetId = hash.replace('#', '');
    let matched = false;

    sections.forEach(sec => {
      if (sec.id === targetId) {
        sec.style.display = 'block';
        matched = true;
      } else {
        sec.style.display = 'none';
      }
    });

    subNavItems.forEach(item => {
      const itemHash = item.getAttribute('href');
      if (itemHash === hash || (matched && itemHash === '#' + targetId)) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (matched) {
      const mainContainer = document.querySelector('main.container');
      if (mainContainer) {
        mainContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  window.addEventListener('hashchange', applyFocus);
  applyFocus();
}

// Run header renderer and sub-navbar focus mode immediately for zero-flicker Navigation
document.addEventListener('DOMContentLoaded', () => {
  renderHeaderSync();
  refreshUserProfile();
  setupSubNavFocusMode();
});

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  renderHeaderSync();
  setupSubNavFocusMode();
}
