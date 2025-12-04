"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function Edit() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    designation: "",
    salary: "",
    created_at: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [emailError, setEmailError] = useState("");

  // --------------------------
  // Logout function
  // --------------------------
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

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
        body: JSON.stringify({ refreshToken: document.cookie.replace("refreshToken=", "") }),
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
  // Redirect if no access token & fetch employee
  // --------------------------
  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        handleLogout();
        return;
      }

      try {
        const res = await apiFetch(`http://localhost:5000/employees/${id}`);
        if (!res) return; // already handled in apiFetch
        if (!res.ok) throw new Error("Failed to fetch employee");

        const data = await res.json();
        setForm(data);
      } catch (err) {
        console.error(err);
        setMessage("Error fetching employee data.");
        setError(true);
      }
    };

    fetchEmployee();
  }, [id]);
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
  // Email validation
  // --------------------------
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (value: string) => {
    setForm({ ...form, email: value });
    setEmailError(!validateEmail(value) ? "Invalid email format. Example: example@test.com" : "");
  };

  // --------------------------
  // Submit handler
  // --------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(form.email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      const res = await apiFetch(`http://localhost:5000/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      if (!res) return; // handled in apiFetch
      if (!res.ok) throw new Error("Failed to update employee");

      setMessage("Employee updated successfully!");
      setError(false);
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Error updating employee. Please try again.");
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
            marginBottom: "10px",
            color: "#000",
          }}
        >
          Edit Employee
        </h1>

        {message && (
          <p
            style={{
              textAlign: "center",
              color: error ? "red" : "green",
              fontWeight: "bold",
            }}
          >
            {message}
          </p>
        )}

        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          style={inputStyle}
          required
        />

        <input
          type="text"
          value={form.email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="Email"
          style={{
            ...inputStyle,
            border: emailError
              ? "1px solid red"
              : form.email.length > 0
              ? "1px solid green"
              : "1px solid #ccc",
          }}
          required
        />
        {emailError && (
          <p style={{ color: "red", fontSize: "14px", marginTop: "-15px" }}>{emailError}</p>
        )}

        <input
          type="text"
          value={form.designation}
          onChange={(e) => setForm({ ...form, designation: e.target.value })}
          placeholder="Designation"
          style={inputStyle}
          required
        />

        <input
          type="number"
          value={form.salary}
          onChange={(e) => setForm({ ...form, salary: e.target.value })}
          placeholder="Salary"
          style={inputStyle}
          required
        />

        <p style={dateStyle}>
          <b>Created At:</b> {form.created_at ? new Date(form.created_at).toLocaleString() : "N/A"}
        </p>

        <button
          type="submit"
          disabled={emailError !== ""}
          style={{
            backgroundColor: emailError ? "#a5a5a5" : "#4CAF50",
            color: "#fff",
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: emailError ? "not-allowed" : "pointer",
            transition: "background-color 0.3s ease",
          }}
        >
          Update
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

const dateStyle = {
  fontSize: "14px",
  color: "#444",
  marginTop: "-10px",
};
