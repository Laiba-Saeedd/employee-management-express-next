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

  // --------------------------
  // Logout function
  // --------------------------
const handleLogout = async () => {
  try {
    await fetch("http://localhost:5000/auth/logout", {
      method: "POST",
      credentials: "include", 
    });

    // Remove access token
    localStorage.removeItem("accessToken");

    router.push("/login");

  } catch (err) {
    console.error("Logout error:", err);
  }
};

  // --------------------------
  // Fetch helper with auto-refresh
  // --------------------------
  async function apiFetch(url: string, options: RequestInit = {}) {
    let token = localStorage.getItem("accessToken");

    // Attach access token
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    options.credentials = "include"; // for HttpOnly refresh cookie

    let res = await fetch(url, options);

    // If access token expired → refresh
    if (res.status === 401) {
      const refreshRes = await fetch("http://localhost:5000/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // sends refresh token cookie
       body: JSON.stringify({ refreshToken: document.cookie.replace("refreshToken=", "") }),

      });

      if (!refreshRes.ok) {
        // refresh token invalid → logout
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
  // Fetch employees on mount
  // --------------------------
  useEffect(() => {
    const fetchEmployees = async () => {
      const res = await apiFetch("http://localhost:5000/employees");
      if (!res) return;

      if (!res.ok) {
        alert("Failed to fetch employees");
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    };

    fetchEmployees();
  }, []);
  
//   useEffect(() => {
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
  // Delete employee
  // --------------------------
  const deleteEmployee = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    const res = await apiFetch(`http://localhost:5000/employees/${id}`, {
      method: "DELETE",
    });

    if (!res) return;
    if (!res.ok) {
      alert("Failed to delete employee");
      return;
    }

    setEmployees(employees.filter(emp => emp.id !== id));
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
