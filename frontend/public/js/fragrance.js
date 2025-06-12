// public/js/fragrance.js
document.addEventListener("DOMContentLoaded", async () => {
  const fragranceSection = document.querySelector(".fragrance-section");

  // Cek jika data sudah ada di localStorage
  let fragrances = JSON.parse(localStorage.getItem("fragrances"));

  if (!fragrances) {
    try {
      const response = await fetch("Link Backend API Endpoint");
      const result = await response.json();

      if (result.error === false) {
        // Hilangkan data yang duplikat berdasarkan name
        const uniqueFragrances = [];
        const namesSeen = new Set();

        for (const item of result.data) {
          if (!namesSeen.has(item.name)) {
            namesSeen.add(item.name);
            uniqueFragrances.push(item);
          }
        }

        // Simpan ke localStorage
        localStorage.setItem("fragrances", JSON.stringify(uniqueFragrances));
        fragrances = uniqueFragrances;
      }
    } catch (error) {
      console.error("Gagal fetch data fragrance:", error);
      fragranceSection.innerHTML = "<p>Gagal memuat data fragrance.</p>";
      return;
    }
  }

  // Tampilkan fragrance ke halaman
  if (fragrances && fragrances.length > 0) {
    fragrances.forEach((fragrance) => {
      const div = document.createElement("div");
      div.className = "fragrance-card";
      div.innerHTML = `
                <h3>${fragrance.name}</h3>
                <p>${fragrance.description}</p>
            `;
      fragranceSection.appendChild(div);
    });
  } else {
    fragranceSection.innerHTML = "<p>Tidak ada data fragrance.</p>";
  }
});
