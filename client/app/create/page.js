"use client";
import { useState } from "react";
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

  // Email validation function
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check email before submitting
    if (!validateEmail(form.email)) {
      setMessage("Please enter a valid email address.");
      setError(true);
      return;
    }

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        throw new Error("Failed to add employee");
      }

      setMessage("Employee added successfully!");
      setError(false);

      // Optionally, clear form
      setForm({ name: "", email: "", designation: "", salary: "" });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (err) {
      console.error(err);
      setMessage("Error adding employee. Please try again.");
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

        {/* Success/Error message */}
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
          style={{
            padding: "12px 15px",
            color: "#000000",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
          required
        />

        <input
          type="text" // Changed from type="email" to type="text" to allow custom validation
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{
            padding: "12px 15px",
            color: "#000000",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
          required
        />

        <input
          type="text"
          placeholder="Designation"
          value={form.designation}
          onChange={(e) => setForm({ ...form, designation: e.target.value })}
          style={{
            padding: "12px 15px",
            borderRadius: "8px",
            color: "#000000",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
          required
        />

        <input
          type="number"
          placeholder="Salary"
          value={form.salary}
          onChange={(e) => setForm({ ...form, salary: e.target.value })}
          style={{
            padding: "12px 15px",
            borderRadius: "8px",
            color: "#000000",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
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
          onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
        >
          Submit
        </button>
      </form>
    </div>
  );
}