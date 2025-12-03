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

  // ✅ Redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, []);

  // Email validation function
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(form.email)) {
      setMessage("Please enter a valid email address.");
      setError(true);
      return;
    }

    try {
      const token = localStorage.getItem("token"); // Add token in Authorization header
      if (!token) throw new Error("Unauthorized");

      const res = await fetch("http://localhost:5000/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Send JWT token
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        if (res.status === 401) {
          setMessage("Session expired. Please login again.");
          setError(true);
          router.push("/login");
          return;
        }
        throw new Error("Failed to add employee");
      }

      setMessage("Employee added successfully!");
      setError(false);
      setForm({ name: "", email: "", designation: "", salary: "" });

      setTimeout(() => {
        router.push("/");
      }, 2000);

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
