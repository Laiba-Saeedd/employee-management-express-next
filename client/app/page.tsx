"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Employee {
  id: number;
  name: string;
  email: string;
  designation: string;
  salary: number;
  created_at: string;
}

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const router = useRouter();

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        // alert("Session expired. Please login again.");
        router.push("/login");
        return;
      }
      try {
        const res = await fetch("/api/employees", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          alert("Session expired. Please login again.");
          handleLogout();
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch employees");

        const data = await res.json();
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

  const deleteEmployee = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please login again.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        alert("Session expired. Please login again.");
        handleLogout();
        return;
      }

      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: "bold" }}>Employee Management System</h1>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "orange",
            color: "white",
            padding: "10px 20px",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          width: "80%",
          margin: "20px auto",
        }}
      >
        <h2 style={{ fontWeight: "bold" }}>Employee List</h2>
        <Link
          href="/create"
          style={{
            backgroundColor: "blue",
            color: "white",
            padding: "8px 16px",
            borderRadius: 8,
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
            <th style={{ border: "1px solid black", padding: 10 }}>Name</th>
            <th style={{ border: "1px solid black", padding: 10 }}>Email</th>
            <th style={{ border: "1px solid black", padding: 10 }}>Designation</th>
            <th style={{ border: "1px solid black", padding: 10 }}>Salary</th>
            <th style={{ border: "1px solid black", padding: 10 }}>Date & Time</th>
            <th style={{ border: "1px solid black", padding: 10 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td style={{ border: "1px solid black", padding: 10 }}>{emp.name}</td>
              <td style={{ border: "1px solid black", padding: 10 }}>{emp.email}</td>
              <td style={{ border: "1px solid black", padding: 10 }}>{emp.designation}</td>
              <td style={{ border: "1px solid black", padding: 10 }}>{emp.salary}</td>
              <td style={{ border: "1px solid black", padding: 10 }}>
                {new Date(emp.created_at).toLocaleString()}
              </td>
              <td style={{ border: "1px solid black", padding: 10 }}>
                <Link
                  href={`/edit/${emp.id}`}
                  style={{
                    display: "inline-block",
                    marginRight: 10,
                    backgroundColor: "green",
                    color: "white",
                    padding: "8px 20px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: 14,
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
                    borderRadius: 8,
                    border: "none",
                    fontWeight: "bold",
                    fontSize: 14,
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
