"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  // Redirect to "/" if valid access token exists
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) router.push("/");
  }, []);
//     useEffect(() => {
//   const interval = setInterval(async () => {
//     const res = await fetch("http://localhost:5000/auth/refresh", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//     });
//     if (res.ok) {
//       const data = await res.json();
//       localStorage.setItem("accessToken", data.accessToken);
//     } else {
//       router.push("/login"); // logout if refresh token expired
//     }
//   }, 30 * 1000); // every 10 minutes

//   return () => clearInterval(interval);
// }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important for HttpOnly cookie (refresh token)
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      // Save access token in localStorage
      localStorage.setItem("accessToken", data.accessToken);

      router.push("/");
    } catch (err: any) {
      console.error("Login error:", err.message);
      setError(err.message);
    }
  };

  // --------------------------
  // API helper to automatically refresh access token
  // --------------------------
  async function apiFetch(url: string, options: RequestInit = {}) {
    let token = localStorage.getItem("accessToken");

    // Attach access token
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    options.credentials = "include";

    let res = await fetch(url, options);

    // If access token expired → refresh
    if (res.status === 401) {
      const refreshRes = await fetch("http://localhost:5000/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // refresh token cookie sent automatically
      // body: JSON.stringify({ refreshToken: document.cookie.replace("refreshToken=", "") }),

      });

      if (!refreshRes.ok) {
        // refresh token invalid → logout
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }

      const refreshData = await refreshRes.json();
      localStorage.setItem("accessToken", refreshData.accessToken);

      // Retry original request with new token
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${refreshData.accessToken}`,
      };
      res = await fetch(url, options);
    }

    return res;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        backgroundColor: "#f5f5f5",
        padding: "20px",
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        style={{
          backgroundColor: "#e0f7fa",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "10px",
            color: "#000",
          }}
        >
          Login
        </h1>

        {error && (
          <p
            style={{
              textAlign: "center",
              color: "red",
              fontWeight: "bold",
            }}
          >
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#4CAF50",
            color: "#fff",
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: "12px 15px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "16px",
  color: "#000",
};
