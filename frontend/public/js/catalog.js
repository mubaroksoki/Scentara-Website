document.addEventListener("DOMContentLoaded", function () {
  // ===== PARFUM CATALOG FUNCTIONALITY =====
  const container = document.querySelector(".product-container");

  // Show loading indicator
  function showLoading() {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading-spinner";
    loadingDiv.innerHTML = `
        <div class="spinner"></div>
        <p>Loading perfumes...</p>
    `;

    document.body.appendChild(loadingDiv);
    document.body.style.overflow = "hidden";
  }

  // Hide loading indicator
  function hideLoading() {
    const loadingElement = document.querySelector(".loading-spinner");
    if (loadingElement) {
      loadingElement.remove();
    }
    document.body.style.overflow = "";
  }

  // Helper function to format price display - IMPROVED VERSION
  function formatPrice(price) {
    // Debug log to see what we're receiving
    console.log("Price input:", price, "Type:", typeof price);

    // Handle null, undefined, or explicit "N/A" values
    if (
      price === null ||
      price === undefined ||
      price === "N/A" ||
      price === "null" ||
      price === "undefined"
    ) {
      return `<span class="invalid-price" style="color:#888;font-style:italic;">Price not available</span>`;
    }

    // Convert to string and clean it
    let priceStr = String(price).trim();

    // Handle empty string after trim
    if (priceStr === "" || priceStr === "0") {
      return `<span class="invalid-price" style="color:#888;font-style:italic;">Price not available</span>`;
    }

    // Remove currency symbols but keep numbers and decimal points
    priceStr = priceStr.replace(/[$,\s]/g, "");

    // Try to parse as number
    const priceNum = parseFloat(priceStr);

    // Check if it's a valid number and greater than 0
    if (isNaN(priceNum) || priceNum <= 0) {
      return `<span class="invalid-price" style="color:#888;font-style:italic;">Price not available</span>`;
    }

    // Format the valid price
    const formattedPrice = priceNum.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return `<span class="valid-price" style="color:#2d7d32;font-weight:bold;">$${formattedPrice}</span>`;
  }

  // Display search info as a modal box
  function displaySearchInfo(query, searchType, resultCount) {
    // Remove any existing modal
    const existingModal = document.getElementById("searchInfoModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "searchInfoModal";
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: linear-gradient(135deg, #800080, #a020a0);
      color: white;
      padding: 28px 28px 20px 28px;
      border-radius: 12px;
      min-width: 320px;
      max-width: 90vw;
      box-shadow: 0 4px 24px rgba(128,0,128,0.25);
      position: relative;
      text-align: center;
    `;

    modalContent.innerHTML = `
      <button id="closeSearchInfoModal" style="
        position: absolute;
        top: 10px; right: 10px;
        background: none;
        border: none;
        color: #fff;
        font-size: 22px;
        cursor: pointer;
        opacity: 0.7;
      " title="Close">&times;</button>
      <div style="margin-bottom: 16px;">
        <strong>Search Results:</strong><br>
        Found ${resultCount} perfume${resultCount !== 1 ? "s" : ""} 
        ${searchType !== "Everything" ? `in ${searchType}` : ""} 
        for "<span style="color:#ffe">${query}</span>"
      </div>
      <button id="clearSearch" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 7px 18px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 8px;
      ">Show All</button>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Close modal on overlay click or close button
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) modalOverlay.remove();
    };
    document.getElementById("closeSearchInfoModal").onclick = () => {
      modalOverlay.remove();
    };

    // Add event listener to clear search button
    document.getElementById("clearSearch").onclick = function () {
      clearSearchAndShowAll();
    };
  }

  // Fetch and display parfums
  function loadParfums(orderBy = null) {
    showLoading();
    let url = "Link Backend API Endpoint";
    if (orderBy) {
      url += `?order_by=${orderBy}`;
    }

    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        hideLoading();
        if (!result.error && result.data && result.data.parfums) {
          let parfums = result.data.parfums;

          // Debug log to see the data structure
          console.log("API Response:", result.data.parfums.slice(0, 2));

          if (!orderBy) {
            parfums = parfums
              .map((p) => ({ sort: Math.random(), value: p }))
              .sort((a, b) => a.sort - b.sort)
              .map((a) => a.value);
          }
          displayParfums(parfums);
        } else {
          container.innerHTML =
            "<div class='no-products'><p>Failed to load perfumes.</p></div>";
        }
      })
      .catch((error) => {
        hideLoading();
        console.error("Error fetching parfums:", error);
        container.innerHTML =
          "<div class='no-products'><p>Error loading perfumes.</p></div>";
      });
  }

  // Add event listener to the order button
  const orderBtn = document.querySelector(".order-btn");
  if (orderBtn) {
    orderBtn.addEventListener("click", function () {
      const currentOrder = this.dataset.order || "random";
      if (currentOrder === "random") {
        this.dataset.order = "name";
        this.textContent = "Sort by Name (A-Z)";

        // Check if we have search results to maintain
        const searchResult = JSON.parse(
          localStorage.getItem("searchResult") || "[]"
        );
        if (searchResult.length > 0) {
          try {
            let parfums = searchResult;
            parfums.sort((a, b) => a.name.localeCompare(b.name));
            displayParfums(parfums);
          } catch (error) {
            loadParfums("name");
          }
        } else {
          loadParfums("name");
        }
      } else {
        this.dataset.order = "random";
        this.textContent = "Order By";

        // Check if we have search results to maintain
        const searchResult = JSON.parse(
          localStorage.getItem("searchResult") || "[]"
        );
        if (searchResult.length > 0) {
          checkSearchResults();
        } else {
          loadParfums();
        }
      }
    });
  }

  // Helper function to get valid image URL
  function getValidImageUrl(imageUrl, productName) {
    if (
      imageUrl &&
      imageUrl.trim() !== "" &&
      imageUrl !== "null" &&
      imageUrl !== "undefined"
    ) {
      return imageUrl;
    }
    return `https://via.placeholder.com/200x200?text=${encodeURIComponent(
      productName || "No Image"
    )}`;
  }

  // Display parfums function - UPDATED WITH IMPROVED PRICE HANDLING
  function displayParfums(parfums) {
    container.innerHTML = "";

    if (!parfums || parfums.length === 0) {
      container.innerHTML =
        "<div class='no-products'><p>No perfumes found.</p></div>";
      return;
    }

    parfums.forEach((parfum) => {
      // Ensure we have all necessary data for display
      if (!parfum.id && (!parfum.name || !parfum.brand_name)) {
        console.error("Product missing essential data:", parfum);
        return;
      }

      const card = document.createElement("div");
      card.className = "product-card";
      card.style.position = "relative";

      // Set dataset id if available
      if (parfum.id) {
        card.dataset.id = parfum.id;
      }

      // Get valid image URL
      let validImageUrl = getValidImageUrl(parfum.image_url, parfum.name);

      // Get price from multiple possible fields
      let priceValue =
        parfum.price || parfum.Price || parfum.price_usd || parfum.retail_price;

      // Debug log for price
      console.log(
        `Product: ${parfum.name}, Price field: ${priceValue}, All fields:`,
        Object.keys(parfum)
      );

      const priceHtml = formatPrice(priceValue);

      card.innerHTML = `
        <img src="${validImageUrl}" 
            alt="${parfum.name || "Product"}" 
            class="product-image"
            onerror="this.onerror=null;this.src='https://via.placeholder.com/200x200?text=${encodeURIComponent(
              parfum.name || "No Image"
            )}'">
          <div class="product-info">
            <p class="product-category">${
              parfum.brand_name || "Unknown Brand"
            }</p>
            <h3 class="product-name">${parfum.name || "Unknown Product"}</h3>
            <p class="product-price">
              ${priceHtml}
            </p>
            ${
              parfum.fragrance_notes
                ? `<p class="product-notes">Notes: ${parfum.fragrance_notes}</p>`
                : ""
            }
          </div>
          ${
            parfum.id
              ? `
      <button class="info-icon" title="Info" style="
        position: absolute;
        top: 10px;
        right: 10px;
        background: #fff;
        border: 2px solid #800080;
        border-radius: 50%;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        z-index: 2;
        transition: background 0.2s;
      "
      onmouseover="this.style.background='#f0f0f0'"
      onmouseout="this.style.background='#fff'"
      >
        <span style="
      display: inline-block;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: transparent;
      color: #800080;
      font-weight: bold;
      font-size: 20px;
      line-height: 28px;
      text-align: center;
        ">!</span>
      </button>
      `
              : ""
          }
    `;

      // Event untuk klik pada kartu produk (hanya jika ada ID)
      if (parfum.id) {
        card.addEventListener("click", (e) => {
          // Don't trigger if clicking the info button
          if (!e.target.closest(".info-icon")) {
            console.log("Clicked product ID:", parfum.id);
            showProductDetailModal(parfum.id);
          }
        });

        // Event untuk klik pada ikon info
        const infoIcon = card.querySelector(".info-icon");
        if (infoIcon) {
          infoIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            showProductDetail(parfum.id);
          });
        }
      }

      container.appendChild(card);
    });
  }

  // Function to show product detail
  function showProductDetail(productId) {
    showLoading();

    fetch(`Link Backend API Endpoint${productId}`)
      .then((response) => response.json())
      .then((result) => {
        hideLoading();
        if (!result.error && result.data) {
          const d = result.data;
          showProductDetailModal(d);
        } else {
          alert("Failed to load perfume detail.");
        }
      })
      .catch(() => {
        hideLoading();
        alert("Error loading perfume detail.");
      });
  }

  // Function to show product detail modal - UPDATED WITH IMPROVED PRICE HANDLING
  function showProductDetailModal(productData) {
    // Remove existing modal if any
    const existingModal = document.getElementById("parfumDetailModal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "parfumDetailModal";
    modal.style.cssText = `
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
    `;

    const validImageUrl = getValidImageUrl(
      productData.image_url,
      productData.name
    );

    // Get price from multiple possible fields for modal
    let modalPriceValue =
      productData.price ||
      productData.Price ||
      productData.price_usd ||
      productData.retail_price;
    const modalPriceHtml = formatPrice(modalPriceValue);

    modal.innerHTML = `
      <div style="background:#fff;max-width:400px;width:90%;padding:24px 18px 18px 18px;border-radius:12px;position:relative;box-shadow:0 4px 24px rgba(0,0,0,0.18)">
        <button id="closeParfumDetailModal" style="position:absolute;top:10px;right:10px;background:none;border:none;font-size:22px;cursor:pointer;color:#800080;">&times;</button>
        <img src="${validImageUrl}" 
             alt="${productData.name || "Product"}" 
             style="width:100%;max-height:220px;object-fit:contain;border-radius:8px;"
             onerror="this.src='https://via.placeholder.com/200x200?text=${encodeURIComponent(
               productData.name || "No Image"
             )}'">
        <h2 style="margin:12px 0 4px 0;font-size:1.3em">${
          productData.name || ""
        }</h2>
        <p style="margin:0 0 4px 0;font-weight:bold;color:#800080">${
          productData.brand_name || ""
        }</p>
        <p style="margin:0 0 8px 0;font-size:1em;color:#444">${
          productData.brand_description || ""
        }</p>
        <p style="margin:0 0 8px 0;"><b>Price:</b> ${modalPriceHtml}</p>
        <p style="margin:0 0 8px 0;"><b>Notes:</b> ${
          productData.fragrance_notes || "-"
        }</p>
        <p style="margin:0 0 8px 0;"><b>Strength:</b> ${
          productData.strength || "-"
        }</p>
        <p style="margin:0 0 8px 0;"><b>Feel:</b> ${productData.feel || "-"}</p>
        <p style="margin:0 0 8px 0;"><b>Description:</b> ${
          productData.description || "-"
        }</p>
        ${
          productData.external_link
            ? `<a href="${productData.external_link}" target="_blank" style="color:#800080;text-decoration:underline;">Official Link</a>`
            : ""
        }
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeParfumDetailModal").onclick = () => {
      modal.remove();
    };
    modal.onclick = (ev) => {
      if (ev.target === modal) modal.remove();
    };
  }

  // Function to check for search results from localStorage
  function checkSearchResults() {
    const searchResult = localStorage.getItem("searchResult");
    const searchQuery = localStorage.getItem("searchQuery");
    const searchType = localStorage.getItem("searchType");

    if (searchResult && searchQuery) {
      try {
        const parfums = JSON.parse(searchResult);

        // Update page title to reflect search
        const mainTitle = document.querySelector(".main-title");
        if (mainTitle) {
          mainTitle.textContent = `Search Results`;
        }

        // Display search info banner
        displaySearchInfo(
          searchQuery,
          searchType || "Everything",
          parfums.length
        );

        // Display the search results
        displayParfums(parfums);

        console.log(
          `Displaying ${parfums.length} search results for "${searchQuery}"`
        );
      } catch (error) {
        console.error("Error parsing search results:", error);
        clearSearchAndShowAll();
      }
    } else {
      // No search results, load all parfums
      loadParfums();
    }
  }

  // Search parfums function (for local catalog search)
  function searchParfums(query) {
    if (!query || query.trim() === "") {
      clearSearchAndShowAll();
      return;
    }

    showLoading();
    const url = `Link Backend API Endpoint${encodeURIComponent(query)}`;

    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        hideLoading();
        if (!result.error && result.data && result.data.parfums) {
          const parfums = result.data.parfums;

          // Update localStorage with new search
          localStorage.setItem("searchResult", JSON.stringify(parfums));
          localStorage.setItem("searchQuery", query);
          localStorage.setItem("searchType", "Everything");

          // Display search info and results
          const mainTitle = document.querySelector(".main-title");
          if (mainTitle) {
            mainTitle.textContent = "Search Results";
          }

          displaySearchInfo(query, "Everything", parfums.length);
          displayParfums(parfums);
        } else {
          container.innerHTML = `
            <div class='no-products'>
              <p>No perfumes found for "${query}".</p>
              <button onclick="clearSearchAndShowAll()" class="btn">Show All Perfumes</button>
            </div>
          `;
        }
      })
      .catch((error) => {
        hideLoading();
        console.error("Error searching parfums:", error);
        container.innerHTML = `
          <div class='no-products'>
            <p>Error searching perfumes. Please try again.</p>
            <button onclick="clearSearchAndShowAll()" class="btn">Show All Perfumes</button>
          </div>
        `;
      });
  }

  // Function to clear search and show all perfumes
  function clearSearchAndShowAll() {
    localStorage.removeItem("searchResult");
    localStorage.removeItem("searchQuery");
    localStorage.removeItem("searchType");

    const banner = document.querySelector(".search-info-banner");
    if (banner) {
      banner.remove();
    }

    const modal = document.getElementById("searchInfoModal");
    if (modal) {
      modal.remove();
    }

    const mainTitle = document.querySelector(".main-title");
    if (mainTitle) {
      mainTitle.textContent = "All Perfumes";
    }

    loadParfums();
  }

  // Make clearSearchAndShowAll globally accessible
  window.clearSearchAndShowAll = clearSearchAndShowAll;

  // ===== MODAL FUNCTIONALITY =====
  const openModalBtn = document.getElementById("openFilterModal");
  const closeModalBtn = document.getElementById("closeFilterModal");
  const modal = document.getElementById("filterModal");
  const resetFilterBtn = document.getElementById("resetFilterBtn");

  if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", function () {
      modal.style.display = "block";
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }

  if (modal) {
    window.addEventListener("click", function (event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  }

  // Reset filter functionality
  function resetFilters() {
    const brandInput = document.getElementById("brand");
    const strengthInput = document.getElementById("strength");
    const minPriceInput = document.getElementById("min-price");
    const maxPriceInput = document.getElementById("max-price");

    if (brandInput) brandInput.value = "";
    if (strengthInput) strengthInput.value = "";
    if (minPriceInput) minPriceInput.value = "";
    if (maxPriceInput) maxPriceInput.value = "";

    // Clear search results and load all parfums
    clearSearchAndShowAll();

    if (modal) {
      modal.style.display = "none";
    }

    console.log("All filters have been reset");
  }

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener("click", resetFilters);
  }

  // Form submission for filters
  const priceFilterForm = document.getElementById("priceFilterForm");
  if (priceFilterForm) {
    priceFilterForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const brand = document.getElementById("brand")?.value.trim() || "";
      const strength = document.getElementById("strength")?.value.trim() || "";
      const minPriceValue =
        parseInt(document.getElementById("min-price")?.value) || 0;
      const maxPriceValue =
        parseInt(document.getElementById("max-price")?.value) || 0;

      if (minPriceValue && maxPriceValue && minPriceValue > maxPriceValue) {
        alert("Minimum price cannot be greater than maximum price!");
        return;
      }

      const params = new URLSearchParams();
      if (brand) params.append("brand", brand);
      if (strength) params.append("strength", strength);
      if (minPriceValue > 0) params.append("min_price", minPriceValue);
      if (maxPriceValue > 0) params.append("max_price", maxPriceValue);

      const url = `Link Backend API Endpoint${params.toString()}`;

      showLoading();
      fetch(url)
        .then((response) => response.json())
        .then((result) => {
          hideLoading();
          if (!result.error && result.data && result.data.parfums) {
            const parfums = result.data.parfums;

            // Clear previous search results since we're filtering
            localStorage.removeItem("searchResult");
            localStorage.removeItem("searchQuery");
            localStorage.removeItem("searchType");

            const banner = document.querySelector(".search-info-banner");
            if (banner) {
              banner.remove();
            }

            displayParfums(parfums);
          } else {
            container.innerHTML =
              "<div class='no-products'><p>No perfumes found with these filters.</p></div>";
          }
        })
        .catch((error) => {
          hideLoading();
          console.error("Error fetching filtered parfums:", error);
          container.innerHTML =
            "<div class='no-products'><p>Error loading filtered perfumes.</p></div>";
        });

      if (modal) {
        modal.style.display = "none";
      }
    });
  }

  // ===== INITIALIZATION =====
  if (container) {
    checkSearchResults();
  }

  // Make functions globally accessible
  window.loadParfums = loadParfums;
  window.searchParfums = searchParfums;
});
