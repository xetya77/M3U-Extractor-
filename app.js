const loadBtn = document.getElementById("loadBtn");
const statusTxt = document.getElementById("status");
const listDiv = document.getElementById("channelList");
const searchInput = document.getElementById("search");
const modeToggle = document.getElementById("modeToggle");

let channels = [];

// LOAD PLAYLIST
loadBtn.onclick = () => {
  const url = document.getElementById("m3uUrl").value.trim();
  if (!url) return statusTxt.innerText = "Paste URL dulu";

  statusTxt.innerText = "Loading playlist...";

  fetch(url)
    .then(res => res.text())
    .then(text => {
      parseM3U(text);
      statusTxt.innerText = `Loaded ${channels.length} channels`;
    })
    .catch(() => statusTxt.innerText = "Gagal load playlist");
};

// PARSE M3U + LOGO
function parseM3U(data) {
  channels = [];
  const lines = data.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {

      const line = lines[i];

      const name = line.split(",")[1]?.trim();

      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : "";

      if (name) channels.push({ name, logo });
    }
  }

  renderList(channels);
}

// RENDER
function renderList(list) {
  listDiv.innerHTML = "";

  list.forEach(ch => {
    const div = document.createElement("div");
    div.className = "channel";

    div.innerHTML = `
      <img src="${ch.logo || ''}" onerror="this.style.display='none'">
      <span>${ch.name}</span>
    `;

    listDiv.appendChild(div);
  });
}

// SEARCH
searchInput.oninput = () => {
  const keyword = searchInput.value.toLowerCase();
  const filtered = channels.filter(ch =>
    ch.name.toLowerCase().includes(keyword)
  );
  renderList(filtered);
};

// COPY ALL
function copyNames() {
  const text = channels.map(ch => ch.name).join("\n");
  navigator.clipboard.writeText(text);
  statusTxt.innerText = "Nama channel dicopy ✔";
}

// EXPORT TXT
function exportTXT() {
  const blob = new Blob([channels.map(ch => ch.name).join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "channels.txt";
  a.click();
}

// DOWNLOAD LOGOS
function downloadLogos() {
  channels.forEach(ch => {
    if (!ch.logo) return;

    const a = document.createElement("a");
    a.href = ch.logo;
    a.download = ch.name + ".png";
    a.click();
  });

  statusTxt.innerText = "Download logo dimulai 🚀";
}

// MODE TOGGLE
modeToggle.onclick = () => {
  document.body.classList.toggle("light");
};
