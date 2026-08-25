/**
 * Practice & Interactive Tools Logic
 * Dynamic Groq AI YouTube Educational Video Recommender & In-Page Player Modal
 */

let currentQuiz = null;
let currentQuestionIndex = 0;
let userQuizScore = 0;

let flashcardsDeck = [];
let currentCardIndex = 0;

let pomodoroTimer = null;
let pomodoroSecondsLeft = 25 * 60;
let isTimerRunning = false;

document.addEventListener('DOMContentLoaded', () => {
  setupQuizEngine();
  setupFlashcardsEngine();
  setupYouTubeRecommender();
  setupPomodoroTimer();
});

// 1. AI Quiz Engine with Sanitized Options & Randomized Correct Answers
function setupQuizEngine() {
  const generateBtn = document.getElementById('generateQuizBtn');
  const quizBox = document.getElementById('activeQuizBox');

  if (!generateBtn) return;

  generateBtn.addEventListener('click', async () => {
    const topic = document.getElementById('quizTopicInput')?.value.trim() || 'Computer Science';
    const difficulty = document.getElementById('quizDifficultySelect')?.value || 'Medium';
    const questionCount = parseInt(document.getElementById('quizCountSelect')?.value || '5', 10);

    generateBtn.disabled = true;
    generateBtn.innerHTML = '⏳ Generating...';
    quizBox.innerHTML = `<div style="padding:2rem;text-align:center;">⏳ <em>Study Mate AI generating ${questionCount} ${difficulty}-level practice questions for "${topic}"...</em></div>`;

    const res = await apiFetch('/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, questionCount, difficulty })
    });

    generateBtn.disabled = false;
    generateBtn.innerHTML = '⚡ Generate Quiz';

    if (res.success && res.quiz) {
      currentQuiz = res.quiz;
      currentQuestionIndex = 0;
      userQuizScore = 0;
      renderCurrentQuizQuestion();
      showToast(`Generated ${res.quiz.questions.length}-question practice quiz!`, 'success');
    } else {
      quizBox.innerHTML = '<div style="color:var(--status-error);text-align:center;padding:1.5rem;">⚠️ Failed to generate quiz. Please check your network connection and try again!</div>';
    }
  });
}

function renderCurrentQuizQuestion() {
  const quizBox = document.getElementById('activeQuizBox');
  if (!quizBox || !currentQuiz || !currentQuiz.questions) return;

  const q = currentQuiz.questions[currentQuestionIndex];
  if (!q) {
    submitQuizResults();
    return;
  }

  let safeOptions = [];
  if (Array.isArray(q.options)) {
    safeOptions = q.options.map((opt, idx) => {
      let text = '';
      if (typeof opt === 'string') text = opt;
      else if (typeof opt === 'object' && opt !== null) text = Object.values(opt)[0] || '';
      else text = String(opt || '');

      return text.replace(/^[A-D1-4][.)]\s*/i, '').trim() || `Option ${String.fromCharCode(65 + idx)}`;
    });
  }

  while (safeOptions.length < 4) {
    safeOptions.push(`Option ${String.fromCharCode(65 + safeOptions.length)}`);
  }

  quizBox.innerHTML = `
    <div style="background:var(--bg-surface);padding:1.75rem;border-radius:var(--radius-lg);border:1px solid var(--border-color);">
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;color:var(--text-muted);font-weight:600;font-size:0.9rem;">
        <span>Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}</span>
        <span>Score: ${userQuizScore} pts</span>
      </div>
      <h3 style="margin-bottom:1.25rem;">${q.question}</h3>
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${safeOptions.map((opt, idx) => `
          <button class="btn btn-secondary quiz-opt-btn" onclick="selectQuizAnswer(${idx})" style="justify-content:flex-start;text-align:left;padding:0.9rem 1.25rem;line-height:1.4;">
            <strong style="color:var(--primary);margin-right:0.4rem;">${String.fromCharCode(65 + idx)}.</strong> ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

window.selectQuizAnswer = async function(idx) {
  const q = currentQuiz.questions[currentQuestionIndex];
  const isCorrect = (idx === q.correctIndex);
  if (isCorrect) userQuizScore += 10;

  showToast(isCorrect ? '✨ Correct! +10 EXP' : `❌ Incorrect! Answer was: ${q.options[q.correctIndex]}`, isCorrect ? 'success' : 'error');

  currentQuestionIndex++;
  setTimeout(renderCurrentQuizQuestion, 800);
};

async function submitQuizResults() {
  const quizBox = document.getElementById('activeQuizBox');
  quizBox.innerHTML = `
    <div style="background:var(--bg-surface);padding:2.5rem;text-align:center;border-radius:var(--radius-lg);border:1px solid var(--primary-border);">
      <div style="font-size:3rem;margin-bottom:0.5rem;">🏆</div>
      <h2>Quiz Completed!</h2>
      <p style="color:var(--text-muted);margin-bottom:1.5rem;">Your Total Score: <strong style="color:var(--primary);font-size:1.4rem;">${userQuizScore} points</strong> (${currentQuiz.questions.length} Questions)</p>
      <button class="btn btn-primary" onclick="document.getElementById('generateQuizBtn').click()">Try Another Quiz</button>
    </div>
  `;

  await apiFetch('/quizzes/result', {
    method: 'POST',
    body: JSON.stringify({
      title: currentQuiz.title,
      subject: 'Practice Quiz',
      score: userQuizScore,
      totalQuestions: currentQuiz.questions.length
    })
  });
}

// 2. 3D Flashcards Engine with User Card Count Input
function setupFlashcardsEngine() {
  const container = document.getElementById('flashcardContainer');
  const generateBtn = document.getElementById('generateFlashcardsBtn');
  const prevBtn = document.getElementById('prevCardBtn');
  const nextBtn = document.getElementById('nextCardBtn');

  if (!container) return;

  container.addEventListener('click', () => {
    container.classList.toggle('flipped');
  });

  generateBtn?.addEventListener('click', async () => {
    const topic = document.getElementById('flashcardTopicInput')?.value.trim() || 'Web Technologies';
    const cardCount = parseInt(document.getElementById('flashcardCountSelect')?.value || '5', 10);
    
    generateBtn.disabled = true;
    generateBtn.innerHTML = '⏳ Generating...';
    showToast(`Generating ${cardCount} AI flashcards deck for "${topic}"...`, 'info');

    const res = await apiFetch('/quizzes/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, cardCount })
    });

    generateBtn.disabled = false;
    generateBtn.innerHTML = '✨ Generate Deck';

    if (res.success && res.cards) {
      flashcardsDeck = res.cards;
      currentCardIndex = 0;
      renderCurrentFlashcard();
      showToast(`Deck generated with ${res.cards.length} cards! Click card to flip 3D.`, 'success');
    }
  });

  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentCardIndex > 0) {
      currentCardIndex--;
      renderCurrentFlashcard();
    }
  });

  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentCardIndex < flashcardsDeck.length - 1) {
      currentCardIndex++;
      renderCurrentFlashcard();
    }
  });

  loadDefaultCards();
}

async function loadDefaultCards() {
  const res = await apiFetch('/quizzes/flashcards');
  if (res.success && res.flashcards && res.flashcards.length > 0) {
    flashcardsDeck = res.flashcards;
    currentCardIndex = 0;
    renderCurrentFlashcard();
  }
}

function renderCurrentFlashcard() {
  const frontEl = document.getElementById('cardFrontText');
  const backEl = document.getElementById('cardBackText');
  const counterEl = document.getElementById('cardCounterText');
  const container = document.getElementById('flashcardContainer');

  if (!flashcardsDeck[currentCardIndex]) return;

  container?.classList.remove('flipped');

  if (frontEl) frontEl.textContent = flashcardsDeck[currentCardIndex].front;
  if (backEl) backEl.textContent = flashcardsDeck[currentCardIndex].back;
  if (counterEl) counterEl.textContent = `Card ${currentCardIndex + 1} of ${flashcardsDeck.length}`;
}

// 3. YouTube Learning Recommender with Dynamic Groq AI Search
function setupYouTubeRecommender() {
  const searchBtn = document.getElementById('searchYoutubeBtn');
  const input = document.getElementById('youtubeSearchInput');
  const resultsGrid = document.getElementById('youtubeResultsGrid');

  if (!searchBtn) return;

  async function fetchVideos(q) {
    resultsGrid.innerHTML = `<div style="padding:2rem;text-align:center;">🔍 <em>Study Mate AI searching YouTube educational video lectures for "${q}"...</em></div>`;
    
    const res = await apiFetch(`/quizzes/youtube-recommendations?q=${encodeURIComponent(q)}`);
    if (res.success && res.videos && res.videos.length > 0) {
      resultsGrid.innerHTML = res.videos.map(v => `
        <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div id="card_video_frame_${v.id}" style="position:relative;background:#000;aspect-ratio:16/9;">
              <img src="${v.thumbnail}" style="width:100%;height:100%;object-fit:cover;opacity:0.85;" alt="${v.title}">
              <button onclick="playYoutubeVideo('${v.embedUrl}', '${v.title.replace(/'/g, "\\'")}')" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(239,68,68,0.95);color:#fff;border:none;border-radius:50%;width:56px;height:56px;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.5);transition:transform 0.2s;" title="Play Video in Player Modal">
                ▶
              </button>
            </div>
            <div style="padding:1rem;">
              <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;font-size:0.8rem;color:var(--primary);font-weight:700;">
                <span>${v.difficulty}</span>
                <span>${v.rating}</span>
              </div>
              <h4 style="font-size:0.95rem;margin-bottom:0.4rem;line-height:1.3;">${v.title}</h4>
              <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem;">📺 ${v.channel} • ${v.duration}</p>
              <p style="font-size:0.8rem;color:var(--text-muted);font-style:italic;line-height:1.3;">💡 ${v.summary}</p>
            </div>
          </div>

          <div style="padding:0 1rem 1rem 1rem;display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
            <button onclick="playYoutubeVideo('${v.embedUrl}', '${v.title.replace(/'/g, "\\'")}')" class="btn btn-primary" style="font-size:0.8rem;padding:0.45rem 0.5rem;">▶️ Play Video</button>
            <a href="${v.youtubeUrl}" target="_blank" class="btn btn-secondary" style="font-size:0.8rem;padding:0.45rem 0.5rem;text-align:center;">YouTube ↗</a>
          </div>
        </div>
      `).join('');
    } else {
      resultsGrid.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">No videos found. Try another search query!</div>';
    }
  }

  searchBtn.addEventListener('click', () => {
    fetchVideos(input.value.trim() || 'Computer Science');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fetchVideos(input.value.trim() || 'Computer Science');
  });

  fetchVideos('Data Structures & Algorithms');
}

window.playYoutubeVideo = function(embedUrl, title) {
  const modal = document.getElementById('youtubePlayerModal');
  const iframe = document.getElementById('ytModalIframe');
  const titleEl = document.getElementById('ytModalTitle');

  if (modal && iframe) {
    if (titleEl) titleEl.textContent = title || 'YouTube Video Lecture';
    iframe.src = embedUrl;
    modal.classList.remove('hidden');
    showToast('Opening YouTube video player...', 'info');
  }
};

window.closeYoutubeModal = function() {
  const modal = document.getElementById('youtubePlayerModal');
  const iframe = document.getElementById('ytModalIframe');

  if (modal && iframe) {
    iframe.src = '';
    modal.classList.add('hidden');
  }
};

let audioCtx = null;
let noiseNode = null;
let isAmbientPlaying = false;
let selectedFocusMins = 25;

const MOTIVATIONAL_QUOTES = [
  `"Success isn't always about greatness. It's about consistency. Consistent hard work leads to success." — Dwayne Johnson`,
  `"Your future is created by what you do today, not tomorrow." — Robert Kiyosaki`,
  `"The secret of getting ahead is getting started. Don't quit now!" — Mark Twain`,
  `"Don't count the days, make the days count." — Muhammad Ali`,
  `"It always seems impossible until it is done. Keep pushing!" — Nelson Mandela`
];

// Web Audio Ambient Rain Sound Synthesizer
function toggleAmbientRainAudio() {
  const soundBtn = document.getElementById('toggleAmbientSoundBtn');
  if (!isAmbientPlaying) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.15;

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noiseNode.start();
      isAmbientPlaying = true;
      if (soundBtn) soundBtn.innerHTML = '🌧️ Ambience ON (Rain)';
      showToast('Soothing rain ambience playing...', 'info');
    } catch(e) {
      console.error('Audio synth error:', e);
    }
  } else {
    if (noiseNode) {
      try { noiseNode.stop(); } catch(e){}
    }
    isAmbientPlaying = false;
    if (soundBtn) soundBtn.innerHTML = '🌧️ Ambience Off';
    showToast('Ambient audio stopped', 'info');
  }
}

// 4. Pomodoro Focus Timer with Custom Intervals, Fullscreen Lock & Motivation Guard
function setupPomodoroTimer() {
  const startBtn = document.getElementById('startTimerBtn');
  const pauseBtn = document.getElementById('pauseTimerBtn');
  const resetBtn = document.getElementById('resetTimerBtn');
  const digitsEl = document.getElementById('timerDigitsDisplay');
  const phaseBadge = document.getElementById('timerPhaseBadge');
  const enterFullscreenBtn = document.getElementById('enterFullscreenBtn');

  const presetBtns = document.querySelectorAll('.timer-preset-btn');
  const customMinsInput = document.getElementById('customFocusMins');
  const applyCustomBtn = document.getElementById('applyCustomTimerBtn');
  const soundBtn = document.getElementById('toggleAmbientSoundBtn');

  const quitModal = document.getElementById('focusQuitGuardModal');
  const resumeBtn = document.getElementById('resumeFocusBtn');
  const confirmQuitBtn = document.getElementById('confirmQuitFocusBtn');
  const minsLeftText = document.getElementById('quitGuardMinsLeftText');
  const motivationQuoteText = document.getElementById('quitGuardMotivationQuote');

  if (!startBtn || !digitsEl) return;

  function updateDisplay() {
    const mins = Math.floor(pomodoroSecondsLeft / 60);
    const secs = pomodoroSecondsLeft % 60;
    digitsEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Update Dynamic SVG Progress Ring Stroke Offset
    const ring = document.getElementById('timerProgressRing');
    if (ring) {
      const totalSeconds = (selectedFocusMins || 25) * 60;
      const progress = Math.max(0, Math.min(1, pomodoroSecondsLeft / totalSeconds));
      const circumference = 2 * Math.PI * 110; // ~691.15px
      const offset = circumference * (1 - progress);

      ring.style.strokeDasharray = `${circumference}`;
      ring.style.strokeDashoffset = `${offset}`;

      // Change stroke color to rose red during final 60 seconds
      if (pomodoroSecondsLeft <= 60 && pomodoroSecondsLeft > 0) {
        ring.style.stroke = 'var(--accent-rose)';
      } else {
        ring.style.stroke = 'var(--primary)';
      }
    }
  }

  function setFocusDuration(mins) {
    if (isTimerRunning) {
      clearInterval(pomodoroTimer);
      isTimerRunning = false;
    }
    selectedFocusMins = parseInt(mins, 10) || 25;
    pomodoroSecondsLeft = selectedFocusMins * 60;
    updateDisplay();
    if (phaseBadge) phaseBadge.textContent = `🧠 FOCUS SESSION (${selectedFocusMins} MINS)`;
  }

  // Preset Buttons Listener
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
      const mins = btn.getAttribute('data-mins');
      if (customMinsInput) customMinsInput.value = mins;
      setFocusDuration(mins);
      showToast(`Timer set to ${mins} minutes!`, 'info');
    });
  });

  // Apply Custom Mins Listener
  if (applyCustomBtn && customMinsInput) {
    applyCustomBtn.addEventListener('click', () => {
      const val = parseInt(customMinsInput.value, 10);
      if (val && val > 0 && val <= 180) {
        setFocusDuration(val);
        showToast(`Custom focus timer set to ${val} minutes!`, 'success');
      } else {
        showToast('Please enter a valid time between 1 and 180 minutes!', 'error');
      }
    });
  }

  // Toggle Ambient Audio
  if (soundBtn) {
    soundBtn.addEventListener('click', toggleAmbientRainAudio);
  }

  // Fullscreen Mode Toggle
  if (enterFullscreenBtn) {
    enterFullscreenBtn.addEventListener('click', () => {
      const pomodoroCard = document.getElementById('pomodoroCardContainer');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(e => {});
      } else {
        const elem = pomodoroCard || document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
        showToast('Entered Fullscreen Focus Mode! Stay dedicated.', 'success');
      }
    });
  }

  // Fullscreen & Quit Guard Handler
  function showQuitGuardModal() {
    if (!isTimerRunning) return;
    const minsLeft = Math.ceil(pomodoroSecondsLeft / 60);
    if (minsLeftText) {
      minsLeftText.textContent = `🔥 You're only ${minsLeft} minute${minsLeft === 1 ? '' : 's'} away from reaching your study goal!`;
    }
    if (motivationQuoteText) {
      const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      motivationQuoteText.textContent = randomQuote;
    }
    if (quitModal) quitModal.classList.remove('hidden');
  }

  // Detect Fullscreen Exit / ESC press while active
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isTimerRunning) {
      showQuitGuardModal();
    }
  });

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      if (quitModal) quitModal.classList.add('hidden');
      const elem = document.getElementById('pomodoroCardContainer') || document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(e => {});
      }
      showToast('Resuming Focus Session! Keep going!', 'success');
    });
  }

  if (confirmQuitBtn) {
    confirmQuitBtn.addEventListener('click', () => {
      clearInterval(pomodoroTimer);
      isTimerRunning = false;
      if (quitModal) quitModal.classList.add('hidden');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(e => {});
      }
      showToast('Focus session ended', 'info');
    });
  }

  // Timer Controls
  startBtn.addEventListener('click', () => {
    if (isTimerRunning) return;
    isTimerRunning = true;
    showToast('🔥 Focus session started! Stay dedicated.', 'success');

    pomodoroTimer = setInterval(() => {
      if (pomodoroSecondsLeft > 0) {
        pomodoroSecondsLeft--;
        updateDisplay();
      } else {
        clearInterval(pomodoroTimer);
        isTimerRunning = false;
        if (phaseBadge) phaseBadge.textContent = '🎉 SESSION COMPLETED!';
        showToast('⏰ Focus Session Completed! Take a well-deserved break!', 'success');
        if (isAmbientPlaying) toggleAmbientRainAudio();
      }
    }, 1000);
  });

  pauseBtn.addEventListener('click', () => {
    clearInterval(pomodoroTimer);
    isTimerRunning = false;
    showToast('Timer paused', 'info');
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(pomodoroTimer);
    isTimerRunning = false;
    setFocusDuration(selectedFocusMins);
    showToast('Timer reset', 'info');
  });

  updateDisplay();
}
