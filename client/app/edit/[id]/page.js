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
    updated_at: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Email validation
 const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};


  // Fetch employee data
  useEffect(() => {
    fetch(`/api/employees/${id}`)
      .then((res) => res.json())
      .then((data) => setForm(data))
      .catch(() => {
        setMessage("Error fetching employee data.");
        setError(true);
      });
  }, [id]);

  // Email change handler
  const handleEmailChange = (value) => {
    setForm({ ...form, email: value });

    if (!validateEmail(value)) {
      setEmailError("Invalid email format. Example: example@test.com");
    } else {
      setEmailError("");
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(form.email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      setMessage("Employee updated successfully!");
      setError(false);

      setTimeout(() => router.push("/"), 2000);
    } catch {
      setMessage("Error updating employee. Please try again.");
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

        {/* Success/Error Message */}
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

        {/* NAME */}
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          style={inputStyle}
          required
        />

        {/* EMAIL */}
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

        {/* Email Error Text */}
        {emailError && (
          <p style={{ color: "red", fontSize: "14px", marginTop: "-15px" }}>
            {emailError}
          </p>
        )}

        {/* DESIGNATION */}
        <input
          type="text"
          value={form.designation}
          onChange={(e) => setForm({ ...form, designation: e.target.value })}
          placeholder="Designation"
          style={inputStyle}
          required
        />

        {/* SALARY */}
        <input
          type="number"
          value={form.salary}
          onChange={(e) => setForm({ ...form, salary: e.target.value })}
          placeholder="Salary"
          style={inputStyle}
          required
        />

        {/* CREATED DATE */}
        <p style={dateStyle}>
          <b>Created At:</b>{" "}
          {form.created_at
            ? new Date(form.created_at).toLocaleString()
            : "N/A"}
        </p>


        {/* SUBMIT BUTTON */}
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