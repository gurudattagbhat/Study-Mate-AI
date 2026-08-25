/**
 * Settings & Account Management Logic
 * Profile updates, Password change, Groq Key config, and Delete Account handler
 */

document.addEventListener('DOMContentLoaded', () => {
  loadUserSettings();
});

async function loadUserSettings() {
  const res = await apiFetch('/auth/profile');
  if (res.success && res.user) {
    const u = res.user;

    // Cache user profile for 0ms header render
    localStorage.setItem('studymate_user_cache', JSON.stringify(u));

    const nameInput = document.getElementById('settingNameInput');
    const emailInput = document.getElementById('settingEmailInput');
    const displayName = document.getElementById('settingsDisplayName');
    const displayEmail = document.getElementById('settingsDisplayEmail');
    const bigAvatar = document.getElementById('settingsBigAvatar');

    const levelBadge = document.getElementById('settingsLevelBadge');
    const expBadge = document.getElementById('settingsExpBadge');
    const streakBadge = document.getElementById('settingsStreakBadge');
    const groqKeyInput = document.getElementById('groqApiKeyInput');

    if (nameInput) nameInput.value = u.name || '';
    if (emailInput) emailInput.value = u.email || '';
    if (displayName) displayName.textContent = u.name || 'Student';
    if (displayEmail) displayEmail.textContent = u.email || 'student@studymate.ai';

    if (bigAvatar) {
      const nameParts = (u.name || 'Student').trim().split(/\s+/);
      const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() 
        : nameParts[0][0].toUpperCase();
      bigAvatar.textContent = initials;
    }

    if (levelBadge) levelBadge.textContent = `Level ${u.level || 1}`;
    if (expBadge) expBadge.textContent = `${(u.exp || 100).toLocaleString()} PTS`;
    if (streakBadge) streakBadge.textContent = `🔥 ${u.streak || 1} Days`;
    if (groqKeyInput) groqKeyInput.value = u.groqApiKey || '';
  }
}

// 1. Update Profile Details
async function handleUpdateProfile(e) {
  e.preventDefault();
  const name = document.getElementById('settingNameInput').value.trim();
  const submitBtn = document.getElementById('saveProfileBtn');

  if (!name) return showToast('Name cannot be empty!', 'error');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Saving...';

  const res = await apiFetch('/auth/settings', {
    method: 'POST',
    body: JSON.stringify({ name })
  });

  submitBtn.disabled = false;
  submitBtn.innerHTML = '💾 Save Profile Updates';

  if (res.success) {
    showToast('Profile updated successfully!', 'success');
    loadUserSettings();
    renderHeaderSync();
  } else {
    showToast(res.message || 'Error updating profile', 'error');
  }
}

// 2. Change Password
async function handleChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPasswordInput').value.trim();
  const newPassword = document.getElementById('newPasswordInput').value.trim();
  const confirmNewPassword = document.getElementById('confirmNewPasswordInput').value.trim();
  const submitBtn = document.getElementById('updatePasswordBtn');

  if (newPassword !== confirmNewPassword) {
    return showToast('New passwords do not match!', 'error');
  }

  if (newPassword.length < 6) {
    return showToast('New password must be at least 6 characters!', 'error');
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Updating...';

  const res = await apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  });

  submitBtn.disabled = false;
  submitBtn.innerHTML = '🔐 Update Password';

  if (res.success) {
    showToast('Password updated successfully!', 'success');
    document.getElementById('changePasswordForm').reset();
  } else {
    showToast(res.message || 'Failed to update password', 'error');
  }
}

// 3. Save Custom Groq Key
async function handleSaveGroqKey(e) {
  e.preventDefault();
  const groqApiKey = document.getElementById('groqApiKeyInput').value.trim();
  const submitBtn = document.getElementById('saveGroqKeyBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Saving...';

  const res = await apiFetch('/auth/settings', {
    method: 'POST',
    body: JSON.stringify({ groqApiKey })
  });

  submitBtn.disabled = false;
  submitBtn.innerHTML = '⚡ Save Groq API Key';

  if (res.success) {
    showToast('Groq API Key configuration saved!', 'success');
  } else {
    showToast(res.message || 'Error saving Groq key', 'error');
  }
}

// 4. Delete Account Permanently
async function handleConfirmDeleteAccount(e) {
  e.preventDefault();
  const password = document.getElementById('deleteAccountPassword').value.trim();
  const submitBtn = document.getElementById('confirmDeleteBtn');

  if (!password) return showToast('Please enter your password!', 'error');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Deleting...';

  const res = await apiFetch('/auth/delete-account', {
    method: 'POST',
    body: JSON.stringify({ password })
  });

  if (res.success) {
    localStorage.removeItem('studymate_token');
    localStorage.removeItem('studymate_user_cache');
    showToast('Account deleted successfully', 'info');
    setTimeout(() => {
      window.location.href = 'signup.html';
    }, 1000);
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Yes, Delete Account';
    showToast(res.message || 'Failed to delete account', 'error');
  }
}
