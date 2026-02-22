document.addEventListener("DOMContentLoaded", () => {

  const loadBtn = document.getElementById("loadBtn");
  const copyBtn = document.getElementById("copyBtn");
  const exportBtn = document.getElementById("exportBtn");
  const statusTxt = document.getElementById("status");
  const listDiv = document.getElementById("channelList");
  const catDiv = document.getElementById("categories");
  const searchInput = document.getElementById("search");
  const loading = document.getElementById("loading");
  const modeToggle = document.getElementById("modeToggle");
  const mainBox = document.getElementById("mainBox");

  const modal = document.getElementById("playerModal");
  const video = document.getElementById("videoPlayer");

  let channels = [];
  let categories = {};
  let activeCategory = "ALL";

  function showLoading(show) {
    loading.style.display = show ? "flex" : "none";
  }

  loadBtn.onclick = () => {

    const url = document.getElementById("m3uUrl").value.trim();
    if (!url) return statusTxt.innerText = "Paste playlist URL";

    showLoading(true);
    statusTxt.innerText = "Loading playlist...";

    fetch(url)
      .then(res => res.text())
      .then(text => {
        parseM3U(text);
        mainBox.classList.remove("centered");
        mainBox.classList.add("shifted");
        statusTxt.innerText = `Loaded ${channels.length} channels`;
        showLoading(false);
      })
      .catch(() => {
        statusTxt.innerText = "Failed to load playlist";
        showLoading(false);
      });
  };

  function parseM3U(data) {

    channels = [];
    categories = {};

    const lines = data.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXTINF")) {

        const line = lines[i];
        const name = line.split(",")[1]?.trim();
        const groupMatch = line.match(/group-title="(.*?)"/);
        const group = groupMatch ? groupMatch[1] : "Uncategorized";
        const streamUrl = lines[i + 1]?.trim();

        if (name && streamUrl) {

          const ch = { name, group, streamUrl };
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

    createCat("ALL");

    Object.keys(categories).forEach(cat => createCat(cat));
  }

  function createCat(name) {
    const div = document.createElement("div");
    div.className = "category";
    div.innerText = name;
    div.onclick = () => {
      activeCategory = name;
      renderChannels(name === "ALL" ? channels : categories[name]);
    };
    catDiv.appendChild(div);
  }

  function renderChannels(list) {
    listDiv.innerHTML = "";

    list.forEach((ch, i) => {
      const div = document.createElement("div");
      div.className = "channel";
      div.style.animationDelay = `${i * 0.025}s`;
      div.innerHTML = `<div>${ch.name}<br><small>${ch.group}</small></div>`;
      div.onclick = () => playStream(ch.streamUrl);
      listDiv.appendChild(div);
    });
  }

  function playStream(url) {
    modal.style.display = "flex";
    video.src = url;
  }

  window.closePlayer = () => {
    modal.style.display = "none";
    video.pause();
    video.src = "";
  };

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(channels.map(c => c.name).join("\n"));
    statusTxt.innerText = "Copied ✔";
  };

  exportBtn.onclick = () => {
    const blob = new Blob([channels.map(c => c.name).join("\n")]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "channels.txt";
    a.click();
  };

  searchInput.oninput = () => {
    const key = searchInput.value.toLowerCase();
    const base = activeCategory === "ALL" ? channels : categories[activeCategory];
    renderChannels(base.filter(c => c.name.toLowerCase().includes(key)));
  };

  modeToggle.onclick = () => {
    document.body.classList.toggle("light");
  };

});
