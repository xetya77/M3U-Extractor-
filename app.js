const video = document.getElementById("video");
const listDiv = document.getElementById("channelList");
const nameDiv = document.getElementById("channelName");

let channels = [];
let currentIndex = 0;
let hls;

// AUTO LOAD PLAYLIST
window.onload = () => {
  const saved = localStorage.getItem("playlist");
  const last = localStorage.getItem("lastChannel");

  if (saved) {
    showApp();
    parseM3U(saved);

    if (last) playChannel(parseInt(last));
  }
};

function showApp() {
  document.getElementById("setup").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

// LOAD PLAYLIST
function loadPlaylist() {
  const url = document.getElementById("playlistUrl").value;

  fetch(url)
    .then(res => res.text())
    .then(text => {
      localStorage.setItem("playlist", text);
      showApp();
      parseM3U(text);
    })
    .catch(() => alert("Playlist gagal dimuat"));
}

// PARSE M3U
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

// RENDER LIST
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

// PLAY CHANNEL
function playChannel(index) {
  currentIndex = index;
  localStorage.setItem("lastChannel", index);

  document.querySelectorAll(".channel").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".channel")[index]?.classList.add("active");

  const src = channels[index].url;
  nameDiv.innerText = channels[index].name;

  if (hls) hls.destroy();

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
  } else {
    video.src = src;
  }
}

// REMOTE / KEYBOARD CONTROL
document.addEventListener("keydown", (e) => {

  // ANGKA → ZAP CHANNEL
  if (e.key >= "1" && e.key <= "9") {
    const num = parseInt(e.key) - 1;
    if (channels[num]) playChannel(num);
  }

  // ARROW UP/DOWN
  if (e.key === "ArrowUp") {
    if (currentIndex > 0) playChannel(currentIndex - 1);
  }

  if (e.key === "ArrowDown") {
    if (currentIndex < channels.length - 1) playChannel(currentIndex + 1);
  }

});
