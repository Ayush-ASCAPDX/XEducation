// wait until page loads
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", login);
});

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById("msg").innerText = "Login Success";

    // save token
    localStorage.setItem("token", data.token);

    // redirect
    window.location.href = "index.html";
  } else {
    document.getElementById("msg").innerText = data.message;
  }
}
