const loadBtn = document.getElementById("loadBtn");
const statusTxt = document.getElementById("status");
const listDiv = document.getElementById("channelList");
const searchInput = document.getElementById("search");

let channelNames = [];

// LOAD PLAYLIST
loadBtn.onclick = () => {
  const url = document.getElementById("m3uUrl").value.trim();
  if (!url) return statusTxt.innerText = "Paste URL dulu";

  statusTxt.innerText = "Loading playlist...";

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(text => {
      parseM3U(text);
      statusTxt.innerText = `Loaded ${channelNames.length} channels`;
    })
    .catch(err => {
      console.error(err);
      statusTxt.innerText = "Gagal load (CORS / URL invalid)";
    });
};

// PARSE M3U
function parseM3U(data) {
  channelNames = [];
  const lines = data.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",")[1]?.trim();
      if (name) channelNames.push(name);
    }
  }

  renderList(channelNames);
}

// RENDER LIST
function renderList(list) {
  listDiv.innerHTML = "";

  list.forEach(name => {
    const div = document.createElement("div");
    div.className = "channel";
    div.innerText = name;
    listDiv.appendChild(div);
  });
}

// SEARCH FILTER
searchInput.oninput = () => {
  const keyword = searchInput.value.toLowerCase();
  const filtered = channelNames.filter(ch =>
    ch.toLowerCase().includes(keyword)
  );
  renderList(filtered);
};

// COPY ALL
function copyNames() {
  if (!channelNames.length) return;

  const text = channelNames.join("\n");
  navigator.clipboard.writeText(text);

  statusTxt.innerText = "Semua nama channel dicopy ✔";
}

// EXPORT TXT
function exportTXT() {
  if (!channelNames.length) return;

  const blob = new Blob([channelNames.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "channels.txt";
  a.click();
}
