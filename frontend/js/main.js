const textInput = document.getElementById('textInput');
const dropzone = document.getElementById('dropzone');
const charCount = document.getElementById('charCount');
const rateSlider = document.getElementById('rateSlider');
const pitchSlider = document.getElementById('pitchSlider');
const rateValue = document.getElementById('rateValue');
const pitchValue = document.getElementById('pitchValue');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const previewBtn = document.getElementById('previewBtn');
const generateBtn = document.getElementById('generateBtn');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');
const advancedToggle = document.getElementById('advancedToggle');
const advancedPanel = document.getElementById('advancedPanel');
const autoPlayCheck = document.getElementById('autoPlayCheck');
const statsPill = document.getElementById('statsPill');

let toastTimer = null;
let generatedCount = parseInt(localStorage.getItem('generatedCount') || '0', 10);

function updateStatsPill() {
  statsPill.textContent = `${generatedCount} generated`;
}
updateStatsPill();

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateCharCount() {
  const len = textInput.value.length;
  const max = textInput.maxLength;
  charCount.textContent = `${len} / ${max}`;
  charCount.classList.toggle('near-limit', len > max * 0.85 && len < max);
  charCount.classList.toggle('at-limit', len >= max);
}
textInput.addEventListener('input', updateCharCount);
updateCharCount();

// drag & drop for .txt files
['dragenter', 'dragover'].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  });
});

dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (!file) return;

  if (!file.name.endsWith('.txt')) {
    showToast('Only .txt files are supported', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    textInput.value = reader.result.slice(0, textInput.maxLength);
    updateCharCount();
    showToast(`Loaded ${file.name}`);
  };
  reader.readAsText(file);
});

rateSlider.addEventListener('input', () => {
  rateValue.textContent = `${parseFloat(rateSlider.value).toFixed(1)}x`;
});

pitchSlider.addEventListener('input', () => {
  pitchValue.textContent = parseFloat(pitchSlider.value).toFixed(1);
});

volumeSlider.addEventListener('input', () => {
  volumeValue.textContent = `${Math.round(parseFloat(volumeSlider.value) * 100)}%`;
});

advancedToggle.addEventListener('click', () => {
  advancedToggle.classList.toggle('open');
  advancedPanel.classList.toggle('open');
});

function runPreview() {
  if (!textInput.value.trim()) {
    showToast('Type something first', true);
    return;
  }

  previewText(
    textInput.value,
    parseFloat(rateSlider.value),
    parseFloat(pitchSlider.value),
    selectedVoiceIndex,
    parseFloat(volumeSlider.value)
  );
}
previewBtn.addEventListener('click', runPreview);

async function runGenerate() {
  const text = textInput.value.trim();
  if (!text) {
    showToast('Type something first', true);
    return;
  }

  const selectedVoice = voices[selectedVoiceIndex];
  const langCode = selectedVoice ? selectedVoice.lang.split('-')[0] : 'en';

  generateBtn.disabled = true;
  generateBtn.classList.add('loading');

  try {
    const res = await fetch(`${API_BASE}/api/tts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: langCode }),
    });

    if (!res.ok) throw new Error('Generation failed');
    const data = await res.json();

    generatedCount++;
    localStorage.setItem('generatedCount', generatedCount);
    updateStatsPill();

    generateBtn.classList.remove('loading');
    generateBtn.classList.add('success');
    setTimeout(() => generateBtn.classList.remove('success'), 1500);

    if (autoPlayCheck.checked) {
      new Audio(`${API_BASE}${data.url}`).play();
    } else {
      window.open(`${API_BASE}${data.url}`, '_blank');
    }

    showToast('Audio generated successfully');
    loadHistory();
  } catch (err) {
    showToast('Something went wrong. Is the backend running?', true);
    generateBtn.classList.remove('loading');
  } finally {
    generateBtn.disabled = false;
  }
}
generateBtn.addEventListener('click', runGenerate);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    runGenerate();
  }
  if (e.ctrlKey && e.code === 'Space') {
    e.preventDefault();
    runPreview();
  }
});

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
});

loadHistory();