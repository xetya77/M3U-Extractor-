document.addEventListener("DOMContentLoaded", () => {

  const loadBtn = document.getElementById("loadBtn");
  const copyBtn = document.getElementById("copyBtn");
  const exportBtn = document.getElementById("exportBtn");
  const statusTxt = document.getElementById("status");
  const listDiv = document.getElementById("channelList");
  const catDiv = document.getElementById("categories");
  const searchInput = document.getElementById("search");
  const loading = document.getElementById("loading");
  const mainBox = document.getElementById("mainBox");

  const modal = document.getElementById("playerModal");
  const video = document.getElementById("videoPlayer");

  let channels = [];
  let categories = {};
  let currentNumberInput = "";

  /* Restore playlist */
  const saved = localStorage.getItem("playlistData");
  if (saved) {
    parseM3U(saved);
    mainBox.classList.add("shifted");
  }

  function showLoading(show) {
    loading.style.display = show ? "flex" : "none";
  }

  loadBtn.onclick = () => {
    const url = document.getElementById("m3uUrl").value.trim();
    if (!url) return;

    showLoading(true);

    fetch(url)
      .then(res => res.text())
      .then(text => {
        localStorage.setItem("playlistData", text);
        parseM3U(text);
        mainBox.classList.add("shifted");
        showLoading(false);
      })
      .catch(() => showLoading(false));
  };

  function parseM3U(data) {

    channels = [];
    categories = {};

    const lines = data.split("\n");

    for (let i = 0; i < lines.length; i++) {

      if (lines[i].startsWith("#EXTINF")) {

        const line = lines[i];
        const name = line.split(",")[1]?.trim();

        const logoMatch = line.match(/tvg-logo="(.*?)"/);
        const groupMatch = line.match(/group-title="(.*?)"/);

        const logo = logoMatch ? logoMatch[1] : "";
        const group = groupMatch ? groupMatch[1] : "Other";
        const streamUrl = lines[i + 1]?.trim();

        if (name && streamUrl) {

          const number = channels.length + 1;

          const ch = { number, name, logo, group, streamUrl };
          channels.push(ch);

          if (!categories[group]) categories[group] = [];
          categories[group].push(ch);
        }
      }
    }

    renderCategories();
    renderChannels(channels);
  }

  function renderCategories() {
    catDiv.innerHTML = "";
    Object.keys(categories).forEach(cat => {
      const div = document.createElement("div");
      div.className = "category";
      div.innerText = cat;
      div.onclick = () => renderChannels(categories[cat]);
      catDiv.appendChild(div);
    });
  }

  function renderChannels(list) {
    listDiv.innerHTML = "";

    list.forEach((ch, i) => {

      const div = document.createElement("div");
      div.className = "channel";
      div.style.animationDelay = `${i * 0.02}s`;

      div.innerHTML = `
        <img src="${ch.logo}" onerror="this.style.display='none'">
        <div>
          <b>${ch.number}. ${ch.name}</b>
          <small>${ch.group}</small>
        </div>
      `;

      div.onclick = () => playStream(ch.streamUrl);
      listDiv.appendChild(div);
    });
  }

  function playStream(url) {

    modal.classList.add("show");

    if (url.endsWith(".m3u8")) {

      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
      } else {
        video.src = url;
      }

    } else if (url.endsWith(".mpd")) {

      const player = dashjs.MediaPlayer().create();
      player.initialize(video, url, true);

    } else {
      video.src = url;
    }
  }

  window.closePlayer = () => {

    modal.classList.remove("show");

    setTimeout(() => {
      video.pause();
      video.src = "";
    }, 300);
  };

  /* Remote / keyboard number zap */
  document.addEventListener("keydown", (e) => {

    if (e.key >= "0" && e.key <= "9") {
      currentNumberInput += e.key;
      statusTxt.innerText = "Channel: " + currentNumberInput;

      setTimeout(() => {
        const num = parseInt(currentNumberInput);
        const found = channels.find(c => c.number === num);
        if (found) playStream(found.streamUrl);

        currentNumberInput = "";
        statusTxt.innerText = "";
      }, 800);
    }

  });

  copyBtn.onclick = () =>
    navigator.clipboard.writeText(channels.map(c => c.name).join("\n"));

  exportBtn.onclick = () => {
    const blob = new Blob([channels.map(c => c.name).join("\n")]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "channels.txt";
    a.click();
  };

  searchInput.oninput = () => {
    const key = searchInput.value.toLowerCase();
    renderChannels(channels.filter(c => c.name.toLowerCase().includes(key)));
  };

});
