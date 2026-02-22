document.addEventListener("DOMContentLoaded", () => {

  const loadBtn = document.getElementById("loadBtn");
  const modeToggle = document.getElementById("modeToggle");
  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");
  const copyBtn = document.getElementById("copyBtn");

  const statusTxt = document.getElementById("status");
  const listDiv = document.getElementById("channelList");
  const catDiv = document.getElementById("categories");
  const searchRow = document.getElementById("searchRow");
  const searchInput = document.getElementById("search");
  const loading = document.getElementById("loading");
  const clock = document.getElementById("clock");

  const modal = document.getElementById("playerModal");
  const video = document.getElementById("videoPlayer");

  let channels = [];
  let categories = {};
  let activeList = [];

  /* ================= CLOCK 24 JAM ================= */
  function updateClock() {
    const now = new Date();

    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");

    clock.innerText = `${h}:${m}:${s}`;
  }

  setInterval(updateClock, 1000);
  updateClock();

  /* ================= RESTORE THEME ================= */
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    modeToggle.innerText = "☀️";
  }

  /* ================= RESTORE PLAYLIST ================= */
  const saved = localStorage.getItem("playlistData");
  if (saved) {
    parseM3U(saved);
    searchRow.classList.remove("hidden");
  }

  function showLoading(show) {
    loading.style.display = show ? "flex" : "none";
  }

  /* ================= LOAD PLAYLIST ================= */
  loadBtn.onclick = () => {

    const url = document.getElementById("m3uUrl").value.trim();
    if (!url) return;

    statusTxt.innerText = "Loading playlist...";
    showLoading(true);

    fetch(url)
      .then(r => r.text())
      .then(text => {
        localStorage.setItem("playlistData", text);
        parseM3U(text);
        searchRow.classList.remove("hidden");

        statusTxt.innerText = `Loaded ${channels.length} channels`;
        showLoading(false);
      })
      .catch(() => {
        statusTxt.innerText = "Failed to load playlist";
        showLoading(false);
      });
  };

  /* ================= PARSE M3U ================= */
  function parseM3U(data) {

    channels = [];
    categories = {};

    const lines = data.split("\n");

    for (let i = 0; i < lines.length; i++) {

      if (lines[i].startsWith("#EXTINF")) {

        const line = lines[i];
        const name = line.split(",")[1]?.trim();
        const logo = line.match(/tvg-logo="(.*?)"/)?.[1] || "";
        const group = line.match(/group-title="(.*?)"/)?.[1] || "Other";
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

    activeList = channels;

    renderCategories();
    renderChannels(activeList);
  }

  /* ================= RENDER CATEGORIES ================= */
  function renderCategories() {
    catDiv.innerHTML = "";

    Object.keys(categories).forEach((cat, i) => {

      const div = document.createElement("div");
      div.className = "category";
      div.innerText = cat;
      div.style.animationDelay = `${i * 0.03}s`;

      div.onclick = () => {
        activeList = categories[cat];
        renderChannels(activeList);
      };

      catDiv.appendChild(div);
    });
  }

  /* ================= RENDER CHANNELS ================= */
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

  /* ================= PLAYER ================= */
  function playStream(url) {

    modal.classList.remove("closing");
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

      dashjs.MediaPlayer().create().initialize(video, url, true);

    } else {
      video.src = url;
    }
  }

  /* ================= CLOSE PLAYER PREMIUM ================= */
  window.closePlayer = () => {

    modal.classList.add("closing");

    setTimeout(() => {
      modal.classList.remove("show", "closing");
      video.pause();
      video.src = "";
    }, 350);
  };

  /* ================= THEME TOGGLE ================= */
  modeToggle.onclick = () => {

    document.body.classList.toggle("light");

    const isLight = document.body.classList.contains("light");

    modeToggle.innerText = isLight ? "☀️" : "🌙";
    localStorage.setItem("theme", isLight ? "light" : "dark");
  };

  /* ================= RESET ================= */
  resetBtn.onclick = () => {
    localStorage.clear();
    location.reload();
  };

  /* ================= EXPORT TXT FIX ================= */
  exportBtn.onclick = () => {

    if (!channels.length) return;

    const blob = new Blob(
      [channels.map(c => c.name).join("\n")],
      { type: "text/plain" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "all_channels.txt";
    a.click();
  };

  /* ================= COPY ================= */
  copyBtn.onclick = () => {
    if (!channels.length) return;
    navigator.clipboard.writeText(channels.map(c => c.name).join("\n"));
    statusTxt.innerText = "Copied ✔";
  };

  /* ================= SEARCH ================= */
  searchInput.oninput = () => {
    const key = searchInput.value.toLowerCase();
    renderChannels(
      activeList.filter(c => c.name.toLowerCase().includes(key))
    );
  };

});
