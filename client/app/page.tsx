"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");

      const data = await res.json();

      // Ensure it's an array and already in descending order
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        console.error("Invalid data format:", data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  fetchEmployees();
}, []);


  const deleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      await fetch(`/api/employees/${id}`, { method: "DELETE" });
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1
        style={{
          textAlign: "center",
          fontSize: "36px",
          fontWeight: "bold",
          marginBottom: "30px",
        }}
      >
        Employee Management System
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          width: "80%",
          margin: "0 auto",
        }}
      >
        <h2 style={{ fontWeight: "bold" }}>Employee List</h2>
        <Link
          href="/create"
          style={{
            backgroundColor: "blue",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          ➕ Add Employee
        </Link>
      </div>

      <table
        style={{
          margin: "50px auto",
          borderCollapse: "collapse",
          width: "80%",
          textAlign: "center",
        }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid white", padding: "10px" }}>Name</th>
            <th style={{ border: "1px solid white", padding: "10px" }}>Email</th>
            <th style={{ border: "1px solid white", padding: "10px" }}>Designation</th>
            <th style={{ border: "1px solid white", padding: "10px" }}>Salary</th>
            <th style={{ border: "1px solid white", padding: "10px" }}>Date & Time</th>
            <th style={{ border: "1px solid white", padding: "10px" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td style={{ border: "1px solid white", padding: "10px" }}>{emp.name}</td>
              <td style={{ border: "1px solid white", padding: "10px" }}>{emp.email}</td>
              <td style={{ border: "1px solid white", padding: "10px" }}>{emp.designation}</td>
              <td style={{ border: "1px solid white", padding: "10px" }}>{emp.salary}</td>
              {/* Show saved date & time */}
              <td style={{ border: "1px solid white", padding: "10px" }}>
                {new Date(emp.created_at).toLocaleString()}
              </td>

              <td style={{ border: "1px solid white", padding: "10px" }}>
                <Link
                  href={`/edit/${emp.id}`}
                  style={{
                    display: "inline-block",
                    marginRight: "10px",
                    backgroundColor: "green",
                    color: "white",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  ✏️ Edit
                </Link>

                <button
                  onClick={() => deleteEmployee(emp.id)}
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "bold",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  🗑️ Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}