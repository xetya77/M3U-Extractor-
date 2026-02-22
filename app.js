const video = document.getElementById('video');
const listDiv = document.getElementById('channelList');

let channels = [];
let currentIndex = 0;

// Auto load playlist kalau ada
window.onload = () => {
  const saved = localStorage.getItem("playlist");
  if (saved) {
    document.getElementById("setup").classList.add("hidden");
    document.getElementById("playerUI").classList.remove("hidden");
    parseM3U(saved);
  }
};

function loadPlaylist() {
  const url = document.getElementById("playlistUrl").value;

  fetch(url)
    .then(res => res.text())
    .then(text => {
      localStorage.setItem("playlist", text);
      document.getElementById("setup").classList.add("hidden");
      document.getElementById("playerUI").classList.remove("hidden");
      parseM3U(text);
    });
}

function parseM3U(data) {
  channels = [];
  const lines = data.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",")[1];
      const url = lines[i + 1]?.trim();
      if (url) channels.push({ name, url });
    }
  }

  renderChannels();
  playChannel(0);
}

function renderChannels() {
  listDiv.innerHTML = "";

  channels.forEach((ch, i) => {
    const div = document.createElement("div");
    div.className = "channel";
    div.innerText = `${i+1}. ${ch.name}`;
    div.onclick = () => playChannel(i);
    listDiv.appendChild(div);
  });
}

function playChannel(index) {
  currentIndex = index;

  document.querySelectorAll(".channel").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".channel")[index]?.classList.add("active");

  const src = channels[index].url;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
  } else {
    video.src = src;
  }
}

// Remote angka support
document.addEventListener("keydown", (e) => {
  if (e.key >= "1" && e.key <= "9") {
    const num = parseInt(e.key) - 1;
    if (channels[num]) playChannel(num);
  }
});
