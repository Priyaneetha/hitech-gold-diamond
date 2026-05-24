async function login() {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("error");

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    errorEl.innerText = "Please enter both username and password.";
    return;
  }

  errorEl.innerText = "";

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      // Redirect to the admin dashboard
      window.location.href = "/dashboard.html";
    } else {
      errorEl.innerText = data.message || "Invalid credentials. Please try again.";
    }
  } catch (err) {
    console.error("Login request failed:", err);
    errorEl.innerText = "Network error. Please try again later.";
  }
}
