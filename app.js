document.addEventListener("DOMContentLoaded", () => {

  const loadBtn = document.getElementById("loadBtn");
  const modeToggle = document.getElementById("modeToggle");
  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");
  const copyBtn = document.getElementById("copyBtn");
  const closeBtn = document.getElementById("closeBtn");

  const hamburger = document.getElementById("hamburger");
  const sideMenu = document.getElementById("sideMenu");
  const sideCategories = document.getElementById("sideCategories");

  const statusTxt = document.getElementById("status");
  const listDiv = document.getElementById("channelList");
  const searchRow = document.getElementById("searchRow");
  const searchInput = document.getElementById("search");
  const loading = document.getElementById("loading");
  const clock = document.getElementById("clock");

  const modal = document.getElementById("playerModal");
  const video = document.getElementById("videoPlayer");

  let channels = [];
  let categories = {};
  let activeList = [];
  let numberBuffer = "";
  let numberTimeout;

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
    if (modeToggle) modeToggle.innerText = "☀️";
  }

  /* ================= RESTORE PLAYLIST ================= */
  const saved = localStorage.getItem("playlistData");
  if (saved) {
    parseM3U(saved);
    if (searchRow) searchRow.classList.remove("hidden");
  }

  function showLoading(show) {
    loading.style.display = show ? "flex" : "none";
  }

  /* ================= HAMBURGER MENU ================= */
  if (hamburger && sideMenu) {
    hamburger.onclick = () => {
      sideMenu.classList.toggle("show");
    };
  }

  /* ================= LOAD PLAYLIST ================= */
  if (loadBtn) {
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

          if (searchRow) searchRow.classList.remove("hidden");

          statusTxt.innerText = `Loaded ${channels.length} channels`;
          showLoading(false);
        })
        .catch(() => {
          statusTxt.innerText = "Failed to load playlist";
          showLoading(false);
        });
    };
  }

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

  /* ================= RENDER CATEGORIES → SIDEBAR ================= */
  function renderCategories() {

    if (!sideCategories) return;

    sideCategories.innerHTML = "";

    Object.keys(categories).forEach(cat => {

      const div = document.createElement("div");
      div.className = "sideCat";
      div.innerText = cat;

      div.onclick = () => {
        activeList = categories[cat];
        renderChannels(activeList);
        sideMenu.classList.remove("show");
      };

      sideCategories.appendChild(div);
    });
  }

  /* ================= RENDER CHANNELS ================= */
  function renderChannels(list) {

    if (!listDiv) return;

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

      div.onclick = () => playStream(ch);

      listDiv.appendChild(div);
    });
  }

  /* ================= PLAYER ================= */
  function playStream(channelObj) {

    modal.classList.remove("closing");
    modal.classList.add("show");

    const url = channelObj.streamUrl;

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

    statusTxt.innerText = `${channelObj.number}. ${channelObj.name}`;
  }

  /* ================= CLOSE PLAYER ================= */
  function closePlayer() {

    modal.classList.add("closing");

    setTimeout(() => {
      modal.classList.remove("show", "closing");
      video.pause();
      video.src = "";
      statusTxt.innerText = "";
    }, 350);
  }

  if (closeBtn) closeBtn.onclick = closePlayer;

  /* ================= THEME TOGGLE ================= */
  if (modeToggle) {
    modeToggle.onclick = () => {

      document.body.classList.toggle("light");

      const isLight = document.body.classList.contains("light");

      modeToggle.innerText = isLight ? "☀️" : "🌙";
      localStorage.setItem("theme", isLight ? "light" : "dark");
    };
  }

  /* ================= RESET ================= */
  if (resetBtn) {
    resetBtn.onclick = () => {
      localStorage.clear();
      location.reload();
    };
  }

  /* ================= EXPORT TXT ================= */
  if (exportBtn) {
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
  }

  /* ================= COPY ================= */
  if (copyBtn) {
    copyBtn.onclick = () => {
      if (!channels.length) return;
      navigator.clipboard.writeText(channels.map(c => c.name).join("\n"));
      statusTxt.innerText = "Copied ✔";
    };
  }

  /* ================= SEARCH ================= */
  if (searchInput) {
    searchInput.oninput = () => {
      const key = searchInput.value.toLowerCase();
      renderChannels(
        activeList.filter(c => c.name.toLowerCase().includes(key))
      );
    };
  }

  /* =====================================================
     🔥 REMOTE / KEYBOARD ANGKA → SWITCH CHANNEL
     ===================================================== */
  document.addEventListener("keydown", (e) => {

    if (e.key >= "0" && e.key <= "9") {

      numberBuffer += e.key;
      statusTxt.innerText = "Channel: " + numberBuffer;

      clearTimeout(numberTimeout);

      numberTimeout = setTimeout(() => {

        const num = parseInt(numberBuffer);

        const found = channels.find(c => c.number === num);

        if (found) {
          playStream(found);
        }

        numberBuffer = "";
        statusTxt.innerText = "";

      }, 700);
    }

  });

});
