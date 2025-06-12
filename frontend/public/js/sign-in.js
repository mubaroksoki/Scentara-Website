document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.querySelector(".password-toggle");
  const eyeOpen = document.querySelector(".eye-open");
  const eyeClosed = document.querySelector(".eye-closed");
  const signInButton = document.querySelector(".btn");
  const emailInput = document.getElementById("email");

  // Toggle password visibility
  toggleBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    eyeOpen.style.display = isHidden ? "none" : "inline";
    eyeClosed.style.display = isHidden ? "inline" : "none";
  });

  signInButton.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Email dan password tidak boleh kosong.");
      return;
    }

    try {
      const response = await fetch("Link Backend API Endpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const result = await response.json();

      if (result.error) {
        alert(result.message);
      } else {
        alert(result.message);
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user)); // Tambahan penting
        window.location.href = "/home"; // Ganti ke path sesuai homepage kamu
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert("Gagal login. Silakan coba lagi.");
    }
  });
});
