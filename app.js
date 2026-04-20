// Wait until the HTML document is fully loaded before running JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Get references to important DOM elements
  const btn = document.getElementById("fetchBtn"); // Search button
  const clearBtn = document.getElementById("clearBtn"); // Clear button
  const input = document.getElementById("userInput"); // Search input field
  const display = document.getElementById("display"); // Area where results are shown
  const status = document.getElementById("status"); // Status message text
  const historyPanel = document.getElementById("historyPanel"); // Search history container
  const showFavsBtn = document.getElementById("showFavsBtn"); // Favorites toggle button

  // Load persisted data from localStorage or use defaults
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  let favorites = JSON.parse(localStorage.getItem("favShows")) || [];
  let currentResults = []; // Store latest search results
  let isShowingFavs = false; // Track whether favorites view is active

  // Apply dark mode if previously enabled
  if (localStorage.getItem("dark-mode") === "enabled") {
    document.body.classList.add("dark");
  }

  // Render saved search history on page load
  renderHistory();

  // Toggle dark/light theme and save preference
  document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "dark-mode",
      document.body.classList.contains("dark") ? "enabled" : "disabled",
    );
  });

  // Clear current search results and input (history remains intact)
  clearBtn.addEventListener("click", () => {
    display.innerHTML = "";
    input.value = "";
    status.textContent = "Ready.";
    currentResults = [];
    isShowingFavs = false;
  });

  // Fetch and display TV shows based on user search input
  const performSearch = async (query) => {
    // Handle empty search input gracefully
    if (!query) {
      status.textContent = "Please provide a search term.";
      return;
    }

    isShowingFavs = false;

    try {
      // Show loading skeleton while fetching data
      showSkeleton();
      status.textContent = "Fetching show data...";

      // Make API request to TVMaze
      const res = await fetch(
        `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      currentResults = data;

      // Handle successful and empty API responses
      if (data.length > 0) {
        updateHistory(query);
        renderResults(data);
      } else {
        status.textContent = "No results found.";
      }
    } catch (error) {
      // Handle network or fetch errors
      status.textContent = "Error fetching data. Please try again.";
    }
  };

  // Trigger search when search button is clicked
  btn.addEventListener("click", () => performSearch(input.value.trim()));

  // Update search history, avoid duplicates, and limit to 5 items
  function updateHistory(term) {
    history = [term, ...history.filter((h) => h !== term)].slice(0, 5);
    localStorage.setItem("searchHistory", JSON.stringify(history));
    renderHistory();
  }

  // Render search history buttons
  function renderHistory() {
    if (history.length === 0) return;
    historyPanel.innerHTML = history
      .map(
        (t) =>
          `<button class="hist-pill" style="background-color: ${getRandomColor()};" onclick="historyClick('${t}')">${t}</button>`,
      )
      .join("");
  }

  // Allow clicking a history item to trigger a new search
  window.historyClick = (t) => {
    input.value = t;
    performSearch(t);
  };

  // Toggle between current search results and favorites
  showFavsBtn.addEventListener("click", () => {
    isShowingFavs = !isShowingFavs;
    if (isShowingFavs) {
      renderResults(favorites.map((f) => ({ show: f })));
    } else {
      renderResults(currentResults);
    }
  });

  // Render TV show cards dynamically
  function renderResults(data) {
    status.textContent = isShowingFavs
      ? `Saved Favorites (${data.length})`
      : `Matches (${data.length})`;

    display.innerHTML = data
      .map((item) => {
        const s = item.show;
        const isFav = favorites.some((fav) => fav.id === s.id);
        // Use 'N/A' if rating is not available
        const rating = s.rating?.average ?? "N/A";

        return `
                <div class="card">
                    <img src="${s.image ? s.image.medium : "https://via.placeholder.com/210x295"}">
                    <div class="card-body">
                        <h3>${s.name}</h3>
                        <p class="rating">⭐ Rating: ${rating}</p>
                        <button class="fav-btn ${isFav ? "active" : ""}"
                                onclick="toggleFav(${s.id})">
                            ${isFav ? "❤️" : "🤍"}
                        </button>
                        
                        <button class="alert-btn"
                                onclick="showAlert('${s.url}')">
                            🔗 Alert
                        </button>

                    </div>
                </div>`;
      })
      .join("");
  }

  // Add or remove a show from favorites and persist it
  window.toggleFav = (id) => {
    const index = favorites.findIndex((f) => f.id === id);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      const found = currentResults.find((r) => r.show.id === id);
      if (found) favorites.push(found.show);
    }

    localStorage.setItem("favShows", JSON.stringify(favorites));

    // Re-render correct view after favorites update
    isShowingFavs
      ? renderResults(favorites.map((f) => ({ show: f })))
      : renderResults(currentResults);
  };

  // Display skeleton loading cards while data is being fetched
  function showSkeleton() {
    display.innerHTML = Array(4)
      .fill('<div class="card skeleton"><div class="skel-img"></div></div>')
      .join("");
  }

  function getRandomColor() {
    const colors = [
      "#adbdf2", // soft indigo
      "#91cccf", // soft cyan
      "#dcfce7", // soft green
      "#fef3c7", // soft amber
      "#fae8ff", // soft purple
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  
    window.showAlert = (url) => {
    alert(`Official Show URL:\n${url}`);
    };

});
