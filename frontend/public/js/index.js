document.addEventListener("DOMContentLoaded", function () {
  const dropdownButton = document.getElementById("dropdownButton");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const selectedOption = document.querySelector(".selected-option");
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  const searchInput = document.querySelector(".search-input input");

  // Toggle dropdown
  if (dropdownButton && dropdownMenu) {
    dropdownButton.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });
  }

  // Handle dropdown item selection
  dropdownItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Remove selected class from all items
      dropdownItems.forEach((i) => i.classList.remove("selected"));

      // Add selected class to clicked item
      this.classList.add("selected");

      // Update selected option text
      if (selectedOption) {
        selectedOption.textContent = this.textContent;
      }

      // Update search placeholder based on selection
      updateSearchPlaceholder(this.dataset.value);

      // Hide dropdown
      dropdownMenu.classList.remove("show");
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function () {
    if (dropdownMenu) {
      dropdownMenu.classList.remove("show");
    }
  });

  // Update search placeholder based on selected filter
  function updateSearchPlaceholder(filterType) {
    if (!searchInput) return;

    const placeholders = {
      Everything: "Search perfume by name, brand, or notes...",
      "Specific perfume": "Search by perfume specific perfume name...",
      Notes: "Search by fragrance notes...",
      Brand: "Search by brand name...",
    };

    searchInput.placeholder =
      placeholders[filterType] || "Search perfume by...";
  }

  // Search functionality
  function performSearch() {
    const query = searchInput.value.trim();
    const searchType = selectedOption.textContent;

    if (!query) {
      alert("Please enter a search term");
      return;
    }

    // Show loading indicator
    showSearchLoading();

    // Determine the search parameter based on selected type
    let searchParam = "search"; // default for "Everything"

    if (searchType === "Specific perfume") {
      searchParam = "name";
    } else if (searchType === "Notes") {
      searchParam = "notes";
    } else if (searchType === "Brand") {
      searchParam = "brand";
    }

    // Build the API URL
    const apiUrl = `Link Backend API Endpoint${searchParam}=${encodeURIComponent(
      query
    )}`;

    // Fetch search results
    fetch(apiUrl)
      .then((response) => response.json())
      .then(async (result) => {
        if (
          !result.error &&
          result.data &&
          result.data.parfums &&
          result.data.parfums.length > 0
        ) {
          // For each parfum, fetch detail to get fragrance_notes
          const parfums = result.data.parfums;
          const parfumDetails = await Promise.all(
            parfums.map(async (parfum) => {
              try {
                const detailRes = await fetch(
                  `Link Backend API Endpoint${parfum.id}`
                );
                const detailJson = await detailRes.json();
                if (
                  !detailJson.error &&
                  detailJson.data &&
                  detailJson.data.fragrance_notes
                ) {
                  return {
                    name: parfum.name,
                    image_url: parfum.image_url,
                    brand_name: parfum.brand_name,
                    fragrance_notes: detailJson.data.fragrance_notes,
                  };
                } else {
                  return {
                    name: parfum.name,
                    image_url: parfum.image_url,
                    brand_name: parfum.brand_name,
                    fragrance_notes: "",
                  };
                }
              } catch (e) {
                return {
                  name: parfum.name,
                  image_url: parfum.image_url,
                  brand_name: parfum.brand_name,
                  fragrance_notes: "",
                };
              }
            })
          );

          hideSearchLoading();

          // Store search results and search info in localStorage
          localStorage.setItem("searchResult", JSON.stringify(parfumDetails));
          localStorage.setItem("searchQuery", query);
          localStorage.setItem("searchType", searchType);

          // Redirect to catalog page
          window.location.href = "/catalog";
        } else {
          hideSearchLoading();
          alert(`No perfumes found for "${query}"`);
        }
      })
      .catch((error) => {
        hideSearchLoading();
        console.error("Search error:", error);
        alert("Error occurred while searching. Please try again.");
      });
  }

  // Show loading during search
  function showSearchLoading() {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "searchLoadingIndicator";
    loadingDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: white;
      font-size: 18px;
    `;
    loadingDiv.innerHTML = `
      <div style="text-align: center;">
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #800080; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
        <p>Searching perfumes...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingDiv);
  }

  // Hide search loading
  function hideSearchLoading() {
    const loadingElement = document.getElementById("searchLoadingIndicator");
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  // Add search functionality to input field
  if (searchInput) {
    // Search on Enter key press
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });

    // Optional: Add search button if you want to include one
    // You can add this to your HTML if needed
    const searchButton = document.querySelector(".search-button");
    if (searchButton) {
      searchButton.addEventListener("click", performSearch);
    }
  }
});
