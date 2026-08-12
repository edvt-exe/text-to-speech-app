const API_BASE = 'http://localhost:3000';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
}

async function loadHistory() {
  const list = document.getElementById('historyList');
  const countBadge = document.getElementById('historyCount');

  try {
    const res = await fetch(`${API_BASE}/api/tts/history`);
    const items = await res.json();

    list.innerHTML = '';
    countBadge.textContent = items.length;

    if (items.length === 0) {
      list.innerHTML = '<li class="empty-state">No history yet</li>';
      return;
    }

    items.forEach((item) => {
      const li = document.createElement('li');

      const top = document.createElement('div');
      top.className = 'history-top';

      const textSpan = document.createElement('span');
      textSpan.className = 'history-text';
      textSpan.textContent = item.text;

      const dateSpan = document.createElement('span');
      dateSpan.className = 'history-date';
      dateSpan.textContent = formatDate(item.createdAt);

      const playBtn = document.createElement('button');
      playBtn.textContent = '▶';

      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = `${API_BASE}/audio/${item.fileName}`;

      playBtn.onclick = () => {
        li.classList.toggle('expanded');
        if (li.classList.contains('expanded')) {
          audio.play();
        } else {
          audio.pause();
        }
      };

      top.appendChild(textSpan);
      top.appendChild(dateSpan);
      top.appendChild(playBtn);
      li.appendChild(top);
      li.appendChild(audio);
      list.appendChild(li);
    });
  } catch (err) {
    list.innerHTML = '<li class="empty-state">Could not load history — is the server running?</li>';
  }
}