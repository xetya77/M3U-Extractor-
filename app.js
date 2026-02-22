const video = document.getElementById('video');
const loadBtn = document.getElementById('loadBtn');
const input = document.getElementById('playlistUrl');
const list = document.getElementById('channelList');

let channels = [];
let selectedIndex = 0;

loadBtn.onclick = async () => {
  const url = input.value.trim();
  const res = await fetch(url);
  const text = await res.text();
  parseM3U(text);
  renderList();
};

function parseM3U(data) {
  channels = [];
  const lines = data.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const name = lines[i].split(',')[1];
      const stream = lines[i + 1];
      channels.push({ name, stream });
    }
  }
}

function renderList() {
  list.innerHTML = '';
  channels.forEach((ch, i) => {
    const div = document.createElement('div');
    div.className = 'channel' + (i === selectedIndex ? ' active' : '');
    div.textContent = `${i+1}. ${ch.name}`;
    list.appendChild(div);
  });
}

function playChannel(index) {
  selectedIndex = index;
  const src = channels[index].stream;

  if (Hls.isSupported() && src.includes('.m3u8')) {
    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
  } else {
    video.src = src;
  }

  renderList();
}

document.addEventListener('keydown', (e) => {
  if (!channels.length) return;

  switch (e.key) {
    case 'ArrowDown':
      selectedIndex = (selectedIndex + 1) % channels.length;
      renderList();
      break;

    case 'ArrowUp':
      selectedIndex = (selectedIndex - 1 + channels.length) % channels.length;
      renderList();
      break;

    case 'Enter':
      playChannel(selectedIndex);
      break;

    default:
      if (!isNaN(e.key)) {
        const num = parseInt(e.key) - 1;
        if (channels[num]) playChannel(num);
      }
  }
});
