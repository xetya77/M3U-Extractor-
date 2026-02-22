const setupDiv = document.getElementById("setup");
const appDiv = document.getElementById("app");
const loadBtn = document.getElementById("loadBtn");
const statusTxt = document.getElementById("status");

const video = document.getElementById("video");
const listDiv = document.getElementById("channelList");
const nameDiv = document.getElementById("channelName");

let channels = [];
let currentIndex = 0;
let hls;

// INIT
window.addEventListener("load", () => {
  console.log("App started");

  const savedPlaylist = localStorage.getItem("playlist");
  const lastChannel = localStorage.getItem("lastChannel");

  if (savedPlaylist) {
    showApp();
    parseM3U(savedPlaylist);

    if (lastChannel) {
      playChannel(parseInt(lastChannel));
    }
  }
});

// BUTTON CLICK
loadBtn.addEventListener("click", () => {
  const url = document.getElementById("playlistUrl").value.trim();

  if (!url) {
    statusTxt.innerText = "Isi URL dulu";
    return;
  }

  statusTxt.innerText = "Loading playlist...";

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(text => {
      localStorage.setItem("playlist", text);
      showApp();
      parseM3U(text);
      statusTxt.innerText = "";
    })
    .catch(err => {
      console.error(err);
      statusTxt.innerText = "Gagal load playlist (CORS / URL)";
    });
});

// SHOW PLAYER
function showApp() {
  setupDiv.classList.add("hidden");
  appDiv.classList.remove("hidden");
}

// PARSE M3U
function parseM3U(data) {
  channels = [];
  const lines = data.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",")[1]?.trim();
      const url = lines[i + 1]?.trim();

      if (name && url && url.startsWith("http")) {
        channels.push({ name, url });
      }
    }
  }

  console.log("Channels:", channels.length);

  renderChannels();
  playChannel(0);
}

// RENDER CHANNELS
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
  if (!channels[index]) return;

  currentIndex = index;
  localStorage.setItem("lastChannel", index);

  document.querySelectorAll(".channel").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".channel")[index]?.classList.add("active");

  const src = channels[index].url;
  nameDiv.innerText = channels[index].name;

  if (hls) hls.destroy();

  if (window.Hls && Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
  } else {
    video.src = src;
  }
}

// REMOTE / KEYBOARD
document.addEventListener("keydown", (e) => {

  if (e.key >= "1" && e.key <= "9") {
    const num = parseInt(e.key) - 1;
    playChannel(num);
  }

  if (e.key === "ArrowUp") {
    if (currentIndex > 0) playChannel(currentIndex - 1);
  }

  if (e.key === "ArrowDown") {
    if (currentIndex < channels.length - 1) playChannel(currentIndex + 1);
  }

});
