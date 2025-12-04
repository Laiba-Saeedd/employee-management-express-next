"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Create() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    designation: "",
    salary: ""
  });
  const [message, setMessage] = useState(""); // For success/error message
  const [error, setError] = useState(false); // For error styling
  const router = useRouter();

  // --------------------------
  // Logout function
  // --------------------------
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

  // --------------------------
  // Redirect if no access token
  // --------------------------
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) handleLogout();
  }, []);
//  useEffect(() => {
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
  // --------------------------
  // API helper with auto-refresh
  // --------------------------
  async function apiFetch(url: string, options: RequestInit = {}) {
    let token = localStorage.getItem("accessToken");

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    options.credentials = "include";

    let res = await fetch(url, options);

    if (res.status === 401) {
      // Access token expired → refresh
      const refreshRes = await fetch("http://localhost:5000/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // body: JSON.stringify({ refreshToken: document.cookie.replace("refreshToken=", "") }),
      });

      if (!refreshRes.ok) {
        handleLogout();
        return null;
      }

      const refreshData = await refreshRes.json();
      localStorage.setItem("accessToken", refreshData.accessToken);

      // Retry original request with new access token
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${refreshData.accessToken}`,
      };
      res = await fetch(url, options);
    }

    return res;
  }

  // --------------------------
  // Email validation
  // --------------------------
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // --------------------------
  // Submit handler
  // --------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(form.email)) {
      setMessage("Please enter a valid email address.");
      setError(true);
      return;
    }

    try {
      const res = await apiFetch("http://localhost:5000/employees", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (!res) return; // already handled in apiFetch
      if (!res.ok) throw new Error("Failed to add employee");

      setMessage("Employee added successfully!");
      setError(false);
      setForm({ name: "", email: "", designation: "", salary: "" });

      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Error adding employee. Please try again.");
      setError(true);
    }
  };

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
        onSubmit={handleSubmit}
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
            marginBottom: "20px",
            color: "#000000",
          }}
        >
          Add Employee
        </h1>

        {message && (
          <div
            style={{
              color: error ? "red" : "green",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            {message}
          </div>
        )}

        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          required
        />
        <input
          type="text"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={inputStyle}
          required
        />
        <input
          type="text"
          placeholder="Designation"
          value={form.designation}
          onChange={(e) => setForm({ ...form, designation: e.target.value })}
          style={inputStyle}
          required
        />
        <input
          type="number"
          placeholder="Salary"
          value={form.salary}
          onChange={(e) => setForm({ ...form, salary: e.target.value })}
          style={inputStyle}
          required
        />

        <button
          type="submit"
          style={buttonStyle}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#45a049")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4CAF50")}
        >
          Submit
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: "12px 15px",
  color: "#000000",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const buttonStyle = {
  backgroundColor: "#4CAF50",
  color: "#fff",
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background-color 0.3s ease",
};
