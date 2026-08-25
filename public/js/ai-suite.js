/**
 * Study Mate AI - AI Suite Feature Handler
 * Real PDF (PDF.js), DOCX (Mammoth.js), Image OCR (Tesseract.js), Viva Topic Generator, and Syllabus File Uploader
 */

let chatHistory = [];
let pdfFollowupHistory = [];
let currentDocumentText = '';
let currentDocumentName = '';

let selectedPdfFile = null;
let selectedImageFile = null;

document.addEventListener('DOMContentLoaded', () => {
  setupChatTutor();
  setupPdfUploader();
  setupPdfFollowup();
  setupImageScanner();
  setupVivaPrep();
  setupExamPrep();
  setupSyllabusAnalyzer();
  setupWeakTopicDetector();
});

/**
 * Clean extracted raw binary or ZIP junk from text
 */
function cleanExtractedText(raw) {
  if (!raw) return '';
  return raw
    .replace(/\uFFFD/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ==========================================================================
   1. AI STUDY TUTOR CHAT
   ========================================================================== */
function setupChatTutor() {
  const sendBtn = document.getElementById('sendChatBtn');
  const input = document.getElementById('chatInput');
  const subjectSelect = document.getElementById('chatSubjectSelect');

  if (!sendBtn || !input) return;

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;

    appendChatBubble('user', text);
    input.value = '';

    chatHistory.push({ sender: 'user', text });
    const subject = subjectSelect?.value || 'General Study';

    const loadingId = appendLoadingBubble('chatMessages');

    const res = await apiFetch('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: text, history: chatHistory, subject })
    });

    removeBubble(loadingId);

    if (res.success && res.response) {
      appendChatBubble('ai', res.response);
      chatHistory.push({ sender: 'ai', text: res.response });
    } else {
      appendChatBubble('ai', '⚠️ Error generating response. Please check your network connection.');
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function appendChatBubble(sender, content, containerId = 'chatMessages') {
  const messagesBox = document.getElementById(containerId);
  if (!messagesBox) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  if (sender === 'ai') {
    bubble.innerHTML = formatMarkdownToHtml(content);
  } else {
    bubble.textContent = content;
  }

  messagesBox.appendChild(bubble);

  // Smoothly scroll container to the top of the AI response bubble so the user reads from the beginning!
  const scrollTarget = () => {
    if (sender === 'ai') {
      const topOffset = bubble.offsetTop - 15;
      messagesBox.scrollTo({
        top: Math.max(0, topOffset),
        behavior: 'smooth'
      });
    } else {
      messagesBox.scrollTo({
        top: messagesBox.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  setTimeout(scrollTarget, 50);
  setTimeout(scrollTarget, 250);
}

function appendLoadingBubble(containerId = 'chatMessages') {
  const messagesBox = document.getElementById(containerId);
  if (!messagesBox) return null;

  const bubble = document.createElement('div');
  const id = 'loading_' + Date.now();
  bubble.id = id;
  bubble.className = 'chat-bubble ai';
  bubble.innerHTML = '⏳ <em>Groq AI is thinking...</em>';
  messagesBox.appendChild(bubble);

  setTimeout(() => {
    const topOffset = bubble.offsetTop - 15;
    messagesBox.scrollTo({
      top: Math.max(0, topOffset),
      behavior: 'smooth'
    });
  }, 50);

  return id;
}

function removeBubble(id) {
  if (!id) return;
  const bubble = document.getElementById(id);
  if (bubble) bubble.remove();
}

/* ==========================================================================
   2. REAL PDF & DOCX PAGE TEXT EXTRACTION & ANALYZER
   ========================================================================== */
function setupPdfUploader() {
  const pdfInput = document.getElementById('pdfFileInput');
  const analyzeBtn = document.getElementById('analyzePdfBtn');
  const clearBtn = document.getElementById('clearPdfFileBtn');

  if (pdfInput) {
    pdfInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleSelectedPdfFile(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      selectedPdfFile = null;
      currentDocumentText = '';
      currentDocumentName = '';
      document.getElementById('pdfFileInput').value = '';
      document.getElementById('pdfFilePreviewCard').classList.add('hidden');
      document.getElementById('pdfTextInput').value = '';
      document.getElementById('pdfResultContainer').classList.add('hidden');
      const charCount = document.getElementById('extractedCharCount');
      if (charCount) charCount.textContent = '0 Characters';
      showToast('File removed');
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      let text = document.getElementById('pdfTextInput')?.value.trim();
      let fileName = selectedPdfFile ? selectedPdfFile.name : 'Study Note Document';

      if (!text && !selectedPdfFile) {
        return showToast('Please select a PDF/Word file or paste text snippet!', 'error');
      }

      currentDocumentText = text || `Document Analysis Request for ${fileName}`;
      currentDocumentName = fileName;
      pdfFollowupHistory = [];

      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = '⏳ Analyzing Document with Groq AI...';

      const container = document.getElementById('pdfResultContainer');
      const resultBox = document.getElementById('pdfResultBox');
      
      if (container) container.classList.remove('hidden');
      if (resultBox) resultBox.innerHTML = '<div style="text-align:center;padding:1.5rem;">⏳ <em>Extracting executive summary, key definitions, formulas and practice exam questions...</em></div>';

      const res = await apiFetch('/ai/analyze-pdf', {
        method: 'POST',
        body: JSON.stringify({ text: currentDocumentText, fileName })
      });

      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '✨ Analyze Document & Generate AI Breakdown';

      if (res.success && res.analysis) {
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="background:var(--bg-surface-elevated);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.5rem;">
              ${formatMarkdownToHtml(res.analysis)}
            </div>
          `;
        }
        showToast('Document analyzed! You can now ask follow-up questions below.', 'success');
      } else {
        showToast('Analysis error', 'error');
      }
    });
  }
}

async function handleSelectedPdfFile(file) {
  selectedPdfFile = file;
  const card = document.getElementById('pdfFilePreviewCard');
  const nameDisplay = document.getElementById('pdfFileNameDisplay');
  const sizeDisplay = document.getElementById('pdfFileSizeDisplay');
  const textInput = document.getElementById('pdfTextInput');
  const charCountDisplay = document.getElementById('extractedCharCount');

  if (card && nameDisplay && sizeDisplay) {
    nameDisplay.textContent = file.name;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    sizeDisplay.textContent = `${sizeMb} MB • Extracting text content...`;
    card.classList.remove('hidden');
  }

  let extractedText = '';
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (window.mammoth) {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        extractedText = cleanExtractedText(result.value);
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        if (sizeDisplay) sizeDisplay.textContent = `${sizeMb} MB • Successfully extracted Word DOCX text (${extractedText.length} characters)`;
      } else {
        const raw = await file.text();
        extractedText = cleanExtractedText(raw);
      }
    } catch (err) {
      console.warn('Word document extraction notice:', err);
      extractedText = `Word Document: "${file.name}"\nDocument Content Analysis Request for ${file.name}`;
    }
  } else if (lowerName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullTextArr = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageStrings = textContent.items.map(item => item.str);
          const pageText = cleanExtractedText(pageStrings.join(' '));
          if (pageText) {
            fullTextArr.push(`[Page ${pageNum}]\n${pageText}`);
          }
        }

        extractedText = fullTextArr.join('\n\n');
        
        if (!extractedText.trim()) {
          extractedText = `PDF Document File Loaded: "${file.name}" (${pdf.numPages} Pages)\nNote: Scanned graphic image PDF without embedded text layer. Groq AI will analyze topic structure based on document metadata.`;
        }

        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        if (sizeDisplay) sizeDisplay.textContent = `${sizeMb} MB • Successfully extracted ${pdf.numPages} pages (${extractedText.length} characters)`;
      } else {
        extractedText = await file.text();
      }
    } catch (err) {
      console.warn('PDF extraction notice:', err);
      extractedText = `PDF Document File: "${file.name}"\nDocument Content Analysis Request for ${file.name}`;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      if (sizeDisplay) sizeDisplay.textContent = `${sizeMb} MB • Document loaded for Groq AI processing`;
    }
  } else {
    try {
      const raw = await file.text();
      extractedText = cleanExtractedText(raw);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      if (sizeDisplay) sizeDisplay.textContent = `${sizeMb} MB • Extracted ${extractedText.length} characters`;
    } catch (err) {
      extractedText = `Document File: ${file.name}`;
    }
  }

  extractedText = cleanExtractedText(extractedText);

  if (textInput) textInput.value = extractedText;
  if (charCountDisplay) charCountDisplay.textContent = `${extractedText.length} Characters Extracted`;
  showToast(`Extracted document text from ${file.name}`, 'success');
}

/* ==========================================================================
   2b. PDF DOCUMENT FOLLOW-UP QUESTIONS HANDLER
   ========================================================================== */
function setupPdfFollowup() {
  const sendBtn = document.getElementById('sendPdfFollowupBtn');
  const input = document.getElementById('pdfFollowupInput');

  if (!sendBtn || !input) return;

  const sendFollowup = async () => {
    const question = input.value.trim();
    if (!question) return;

    if (!currentDocumentText && !selectedPdfFile) {
      return showToast('Please analyze a document first before asking follow-up questions!', 'error');
    }

    appendChatBubble('user', question, 'pdfFollowupMessages');
    input.value = '';

    pdfFollowupHistory.push({ sender: 'user', text: question });
    const loadingId = appendLoadingBubble('pdfFollowupMessages');

    const res = await apiFetch('/ai/analyze-pdf-followup', {
      method: 'POST',
      body: JSON.stringify({
        documentText: currentDocumentText,
        fileName: currentDocumentName || 'Analyzed Document',
        question,
        history: pdfFollowupHistory
      })
    });

    removeBubble(loadingId);

    if (res.success && res.answer) {
      appendChatBubble('ai', res.answer, 'pdfFollowupMessages');
      pdfFollowupHistory.push({ sender: 'ai', text: res.answer });
    } else {
      appendChatBubble('ai', '⚠️ Error generating follow-up answer. Please try again.', 'pdfFollowupMessages');
    }
  };

  sendBtn.addEventListener('click', sendFollowup);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendFollowup();
  });
}

/* ==========================================================================
   3. REAL IMAGE OCR SCANNER WITH TESSERACT.JS
   ========================================================================== */
function setupImageScanner() {
  const imageInput = document.getElementById('imageFileInput');
  const scanBtn = document.getElementById('scanImageBtn');
  const sampleBtn = document.getElementById('sampleScanBtn');
  const clearBtn = document.getElementById('clearImageFileBtn');

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleSelectedImageFile(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      selectedImageFile = null;
      document.getElementById('imageFileInput').value = '';
      document.getElementById('imagePreviewCard').classList.add('hidden');
      document.getElementById('imageOcrText').value = '';
      showToast('Image removed');
    });
  }

  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      document.getElementById('imagePreviewImg').src = 'assets/hero.jpg';
      document.getElementById('imageFileNameDisplay').textContent = 'demo_whiteboard_notes.jpg';
      document.getElementById('imagePreviewCard').classList.remove('hidden');
      document.getElementById('imageOcrText').value = `Unit 2 Lecture Notes:
- Sorting Algorithms: QuickSort, MergeSort, HeapSort
- QuickSort Time Complexity: Best O(N log N), Worst O(N^2) when array is already sorted.
- Space Complexity: O(log N) due to recursive stack calls.`;
      showToast('Demo whiteboard scan loaded!', 'success');
    });
  }

  if (scanBtn) {
    scanBtn.addEventListener('click', async () => {
      const text = document.getElementById('imageOcrText')?.value.trim();
      if (!text && !selectedImageFile) {
        return showToast('Please select a photo image or enter transcribed text!', 'error');
      }

      scanBtn.disabled = true;
      scanBtn.innerHTML = '⏳ Processing Scan with Groq AI...';

      const resultBox = document.getElementById('imageScanResult');
      if (resultBox) resultBox.innerHTML = '<div style="text-align:center;padding:1.5rem;">⏳ <em>Cleaning OCR transcript and generating concept notes...</em></div>';

      const res = await apiFetch('/ai/ocr-scan', {
        method: 'POST',
        body: JSON.stringify({ extractedText: text || 'Whiteboard Note Scan: QuickSort and MergeSort trade-offs' })
      });

      scanBtn.disabled = false;
      scanBtn.innerHTML = '📸 Process Note Scan with Groq AI';

      if (res.success && res.analysis) {
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="background:var(--bg-surface-elevated);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.5rem;">
              ${formatMarkdownToHtml(res.analysis)}
            </div>
          `;
        }
        showToast('Image notes processed successfully!', 'success');
      }
    });
  }
}

async function handleSelectedImageFile(file) {
  selectedImageFile = file;
  const card = document.getElementById('imagePreviewCard');
  const img = document.getElementById('imagePreviewImg');
  const nameDisplay = document.getElementById('imageFileNameDisplay');
  const ocrText = document.getElementById('imageOcrText');

  if (card && img && nameDisplay) {
    nameDisplay.textContent = file.name;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageSrc = e.target.result;
      img.src = imageSrc;
      card.classList.remove('hidden');

      if (ocrText) ocrText.value = '⏳ Running AI OCR text extraction on photo... Please wait a moment!';
      showToast('Running Tesseract OCR text extraction on image...', 'info');

      try {
        if (window.Tesseract) {
          const worker = await Tesseract.createWorker('eng');
          const ret = await worker.recognize(imageSrc);
          await worker.terminate();

          const extracted = cleanExtractedText(ret.data.text);
          if (extracted && extracted.length > 5) {
            ocrText.value = extracted;
            showToast(`OCR Success: Extracted ${extracted.length} characters from photo!`, 'success');
          } else {
            ocrText.value = `Scanned Photo: ${file.name}\n- Handwritten lecture notes snapshot ready for Groq AI processing.`;
            showToast('Photo loaded for Groq AI processing', 'info');
          }
        } else {
          ocrText.value = `Scanned Note Image: ${file.name}\n- Whiteboard lecture note scan ready for Groq AI processing.`;
        }
      } catch (err) {
        console.warn('Tesseract OCR notice:', err);
        ocrText.value = `Scanned Note Image: ${file.name}\n- Whiteboard lecture note scan ready for Groq AI processing.`;
      }
    };
    reader.readAsDataURL(file);
  }
}

/* ==========================================================================
   4. AI VIVA PREPARATION WITH DYNAMIC TOPIC QUESTION GENERATION
   ========================================================================== */
function setupVivaPrep() {
  const evalBtn = document.getElementById('evaluateVivaBtn');
  const newQBtn = document.getElementById('newVivaQuestionBtn');
  const topicInput = document.getElementById('vivaTopicInput');
  const topicBadge = document.getElementById('vivaTopicBadge');
  const qText = document.getElementById('vivaQuestionText');

  if (newQBtn) {
    newQBtn.addEventListener('click', async () => {
      const topic = topicInput?.value.trim() || 'Database Management Systems';
      newQBtn.disabled = true;
      newQBtn.innerHTML = '⏳ Generating Question...';

      if (topicBadge) topicBadge.textContent = `Topic: ${topic}`;

      const res = await apiFetch('/ai/viva-question', {
        method: 'POST',
        body: JSON.stringify({ topic })
      });

      newQBtn.disabled = false;
      newQBtn.innerHTML = '🎲 Generate Viva Question';

      if (res.success && res.question) {
        let questionClean = res.question.replace(/^"/, '').replace(/"$/, '').trim();
        qText.textContent = `"${questionClean}"`;
        document.getElementById('vivaAnswerInput').value = '';
        document.getElementById('vivaResultBox').innerHTML = '';
        showToast(`New Groq viva question generated for ${topic}!`, 'success');
      }
    });
  }

  if (evalBtn) {
    evalBtn.addEventListener('click', async () => {
      const answer = document.getElementById('vivaAnswerInput')?.value.trim();
      const question = qText?.textContent || "Explain BCNF Normalization.";
      const topic = topicInput?.value.trim() || 'Database Management Systems';

      if (!answer) return showToast('Please enter your oral viva answer!', 'error');

      evalBtn.disabled = true;
      evalBtn.innerHTML = '⏳ Evaluating Answer...';

      const res = await apiFetch('/ai/viva-prep', {
        method: 'POST',
        body: JSON.stringify({ question, answer, topic })
      });

      evalBtn.disabled = false;
      evalBtn.innerHTML = '🎤 Evaluate Viva Answer & Get Score';

      const resultBox = document.getElementById('vivaResultBox');
      if (res.success && res.assessment) {
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="background:var(--bg-surface-elevated);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.5rem;">
              ${formatMarkdownToHtml(res.assessment)}
            </div>
          `;
        }
        showToast('Viva evaluation complete!', 'success');
      }
    });
  }
}

/* ==========================================================================
   5. EXAM PREP MODE
   ========================================================================== */
function setupExamPrep() {
  const prepBtn = document.getElementById('generateExamPrepBtn');
  if (!prepBtn) return;

  prepBtn.addEventListener('click', async () => {
    const subject = document.getElementById('examSubjectInput')?.value.trim() || 'Operating Systems';
    const targetDate = document.getElementById('examTargetDate')?.value || '2026-09-05';

    prepBtn.disabled = true;
    prepBtn.innerHTML = '⏳ Generating Exam Strategy...';

    const resultBox = document.getElementById('examPrepResultBox');
    if (resultBox) resultBox.innerHTML = '<div style="text-align:center;padding:1.5rem;">⏳ <em>Building high-yield exam guide...</em></div>';

    const res = await apiFetch('/ai/exam-prep', {
      method: 'POST',
      body: JSON.stringify({ subject, targetDate })
    });

    prepBtn.disabled = false;
    prepBtn.innerHTML = '⚡ Generate High-Yield Cheat Sheet & Exam Strategy';

    if (res.success && res.guide) {
      if (resultBox) {
        resultBox.innerHTML = `
          <div style="background:var(--bg-surface-elevated);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.5rem;">
            ${formatMarkdownToHtml(res.guide)}
          </div>
        `;
      }
      showToast('Exam guide generated!', 'success');
    }
  });
}

/* ==========================================================================
   6. SYLLABUS ANALYZER WITH PDF / DOCX FILE UPLOADER
   ========================================================================== */
function setupSyllabusAnalyzer() {
  const analyzeBtn = document.getElementById('analyzeSyllabusBtn');
  const fileInput = document.getElementById('syllabusFileInput');
  const clearBtn = document.getElementById('clearSyllabusFileBtn');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleSelectedSyllabusFile(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.getElementById('syllabusFileInput').value = '';
      document.getElementById('syllabusFilePreviewCard').classList.add('hidden');
      document.getElementById('syllabusInputText').value = '';
      showToast('Syllabus file removed');
    });
  }

  if (!analyzeBtn) return;

  analyzeBtn.addEventListener('click', async () => {
    const courseName = document.getElementById('syllabusCourseInput')?.value.trim() || 'Database Systems';
    const text = document.getElementById('syllabusInputText')?.value.trim();

    if (!text) {
      return showToast('Please select a syllabus file (PDF/DOCX) or paste syllabus text!', 'error');
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '⏳ Analyzing Syllabus...';

    const resultBox = document.getElementById('syllabusResultBox');
    if (resultBox) resultBox.innerHTML = '<div style="text-align:center;padding:1.5rem;">⏳ <em>Formatting units and difficulty ratings...</em></div>';

    const res = await apiFetch('/ai/syllabus-analyzer', {
      method: 'POST',
      body: JSON.stringify({ syllabusText: text, courseName })
    });

    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '📖 Analyze Syllabus Structure with Study Mate AI';

    if (res.success && res.analysis) {
      if (resultBox) {
        resultBox.innerHTML = `
          <div style="background:var(--bg-surface-elevated);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.5rem;">
            ${formatMarkdownToHtml(res.analysis)}
          </div>
        `;
      }
      showToast('Syllabus analysis complete!', 'success');
    }
  });
}

async function handleSelectedSyllabusFile(file) {
  const card = document.getElementById('syllabusFilePreviewCard');
  const nameDisplay = document.getElementById('syllabusFileNameDisplay');
  const sizeDisplay = document.getElementById('syllabusFileSizeDisplay');
  const textInput = document.getElementById('syllabusInputText');

  if (card && nameDisplay && sizeDisplay) {
    nameDisplay.textContent = file.name;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    sizeDisplay.textContent = `${sizeMb} MB • Extracting text content...`;
    card.classList.remove('hidden');
  }

  let extractedText = '';
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (window.mammoth) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = cleanExtractedText(result.value);
      } else {
        extractedText = cleanExtractedText(await file.text());
      }
    } catch (err) {
      extractedText = `Syllabus Document: ${file.name}`;
    }
  } else if (lowerName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullTextArr = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = cleanExtractedText(textContent.items.map(item => item.str).join(' '));
          if (pageText) fullTextArr.push(`[Unit / Page ${i}]\n${pageText}`);
        }
        extractedText = fullTextArr.join('\n\n');
      } else {
        extractedText = await file.text();
      }
    } catch (err) {
      extractedText = `Syllabus PDF File: ${file.name}`;
    }
  } else {
    extractedText = cleanExtractedText(await file.text());
  }

  extractedText = cleanExtractedText(extractedText);
  if (textInput) textInput.value = extractedText;

  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  if (sizeDisplay) sizeDisplay.textContent = `${sizeMb} MB • Extracted ${extractedText.length} characters`;
  showToast(`Extracted syllabus text from ${file.name}`, 'success');
}

/* ==========================================================================
   7. WEAK TOPIC DETECTOR
   ========================================================================== */
function setupWeakTopicDetector() {
  const refreshBtn = document.getElementById('refreshWeakTopicsBtn');
  loadWeakTopics();

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadWeakTopics();
    });
  }
}

async function loadWeakTopics() {
  const reportBox = document.getElementById('weakTopicsReport');
  const planBox = document.getElementById('revisionPlanBox');

  const res = await apiFetch('/ai/weak-topics');

  if (res.success && res.weakTopics) {
    if (reportBox) reportBox.innerHTML = formatMarkdownToHtml(res.weakTopics);
  }

  const revisionRes = await apiFetch('/ai/revision-plan');
  if (revisionRes.success && revisionRes.plan) {
    if (planBox) planBox.innerHTML = formatMarkdownToHtml(revisionRes.plan);
  }
}
