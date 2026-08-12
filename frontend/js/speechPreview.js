const synth = window.speechSynthesis;
let voices = [];
let selectedVoiceIndex = 0;

const voicePicker = document.getElementById('voicePicker');
const voiceTrigger = document.getElementById('voiceTrigger');
const voiceTriggerText = document.getElementById('voiceTriggerText');
const voiceDropdown = document.getElementById('voiceDropdown');
const voiceSearch = document.getElementById('voiceSearch');
const voiceList = document.getElementById('voiceList');

function loadVoices() {
  voices = synth.getVoices();
  if (voices.length === 0) return;

  renderVoiceList(voices);
  selectVoice(selectedVoiceIndex);
}

synth.onvoiceschanged = loadVoices;
loadVoices();

function renderVoiceList(list) {
  voiceList.innerHTML = '';

  if (list.length === 0) {
    voiceList.innerHTML = '<div class="voice-list-empty">No voices match your search</div>';
    return;
  }

  // group voices by language so the list is easier to scan
  const groups = {};
  list.forEach((voice) => {
    const langLabel = voice.lang;
    if (!groups[langLabel]) groups[langLabel] = [];
    groups[langLabel].push(voice);
  });

  Object.keys(groups).sort().forEach((lang) => {
    const groupLabel = document.createElement('div');
    groupLabel.className = 'voice-group-label';
    groupLabel.textContent = lang;
    voiceList.appendChild(groupLabel);

    groups[lang].forEach((voice) => {
      const realIndex = voices.indexOf(voice);
      const option = document.createElement('div');
      option.className = 'voice-option';
      if (realIndex === selectedVoiceIndex) option.classList.add('selected');

      const name = document.createElement('span');
      name.textContent = voice.name;

      const langTag = document.createElement('span');
      langTag.className = 'voice-option-lang';
      langTag.textContent = voice.lang;

      option.appendChild(name);
      option.appendChild(langTag);

      option.addEventListener('click', () => {
        selectVoice(realIndex);
        closeDropdown();
      });

      voiceList.appendChild(option);
    });
  });
}

function selectVoice(index) {
  selectedVoiceIndex = index;
  const voice = voices[index];
  if (voice) {
    voiceTriggerText.textContent = `${voice.name} (${voice.lang})`;
  }
  renderVoiceList(filterVoices(voiceSearch.value));
}

function filterVoices(query) {
  if (!query) return voices;
  const q = query.toLowerCase();
  return voices.filter(
    (v) => v.name.toLowerCase().includes(q) || v.lang.toLowerCase().includes(q)
  );
}

function openDropdown() {
  voicePicker.classList.add('open');
  voiceSearch.value = '';
  renderVoiceList(voices);
  voiceSearch.focus();
}

function closeDropdown() {
  voicePicker.classList.remove('open');
}

voiceTrigger.addEventListener('click', () => {
  voicePicker.classList.contains('open') ? closeDropdown() : openDropdown();
});

voiceSearch.addEventListener('input', () => {
  renderVoiceList(filterVoices(voiceSearch.value));
});

// close the dropdown when clicking outside of it
document.addEventListener('click', (e) => {
  if (!voicePicker.contains(e.target)) closeDropdown();
});

function previewText(text, rate, pitch, voiceIndex, volume = 1) {
  if (!text.trim()) return;

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  if (voices[selectedVoiceIndex]) {
    utterance.voice = voices[selectedVoiceIndex];
  }

  const waveform = document.getElementById('waveform');

  utterance.onstart = () => waveform.classList.add('active');
  utterance.onend = () => waveform.classList.remove('active');
  utterance.onerror = () => waveform.classList.remove('active');

  synth.speak(utterance);
}