document.addEventListener("DOMContentLoaded", () => {

  console.log("DOM ready");

  const loadBtn = document.getElementById("loadBtn");
  const statusTxt = document.getElementById("status");
  const listDiv = document.getElementById("channelList");
  const catDiv = document.getElementById("categories");
  const searchInput = document.getElementById("search");
  const loading = document.getElementById("loading");
  const modeToggle = document.getElementById("modeToggle");
  const inputUrl = document.getElementById("m3uUrl");

  if (!loadBtn || !loading) {
    console.error("Element missing");
    return;
  }

  let channels = [];
  let categories = {};
  let activeCategory = "ALL";

  // Ensure spinner hidden at start
  showLoading(false);

  loadBtn.addEventListener("click", () => {

    const url = inputUrl.value.trim();
    if (!url) {
      statusTxt.innerText = "Paste playlist URL";
      return;
    }

    statusTxt.innerText = "Loading playlist...";
    showLoading(true);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(text => {
        parseM3U(text);
        statusTxt.innerText = `Loaded ${channels.length} channels`;
        showLoading(false);
      })
      .catch(err => {
        console.error(err);
        statusTxt.innerText = "Failed to load playlist (CORS / invalid URL)";
        showLoading(false);
      });

  });

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
        const group = groupMatch ? groupMatch[1] : "Uncategorized";

        if (name) {

          const ch = { name, logo, group };
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

    createCategoryButton("ALL");

    Object.keys(categories).forEach(cat => {
      createCategoryButton(cat);
    });
  }

  function createCategoryButton(name) {

    const div = document.createElement("div");
    div.className = "category";
    div.innerText = name;

    div.addEventListener("click", () => {
      activeCategory = name;
      const list = name === "ALL" ? channels : categories[name];
      renderChannels(list);
    });

    catDiv.appendChild(div);
  }

  function renderChannels(list) {

    listDiv.innerHTML = "";

    list.forEach(ch => {

      const div = document.createElement("div");
      div.className = "channel";

      div.innerHTML = `
        <img src="${ch.logo}" onerror="this.style.display='none'">
        <div>
          <div>${ch.name}</div>
          <small>${ch.group}</small>
        </div>
      `;

      listDiv.appendChild(div);
    });
  }

  searchInput.addEventListener("input", () => {

    const key = searchInput.value.toLowerCase();

    const baseList = activeCategory === "ALL"
      ? channels
      : categories[activeCategory] || [];

    const filtered = baseList.filter(ch =>
      ch.name.toLowerCase().includes(key)
    );

    renderChannels(filtered);
  });

  function showLoading(show) {
    loading.classList.toggle("hidden", !show);
  }

  modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
  });

});
