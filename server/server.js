require("dotenv").config(); // ← Add this at the very top
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// DB Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Test DB
db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected");
});

/* -------------------- ROUTES -------------------- */

// 🔥 GET LAST ADDED employee (instead of all)
app.get("/employees", (req, res) => {
  db.query(
    "SELECT * FROM employees ORDER BY id DESC",
    (err, results) => {
      if (err) return res.json(err);
      res.json(results);
    }
  );
});

// Fetch one employee by id
app.get("/employees/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM employees WHERE id = ?", [id], (err, result) => {
    if (err) return res.json(err);
    res.json(result[0]);
  });
});

// 🔥 POST create new employee with date/time
app.post("/employees", (req, res) => {
  const { name, email, designation, salary } = req.body;

  const sql =
    "INSERT INTO employees (name, email, designation, salary, created_at) VALUES (?, ?, ?, ?, NOW())";

  db.query(sql, [name, email, designation, salary], (err, result) => {
    if (err) return res.json(err);

    res.json({
      message: "Employee added",
      id: result.insertId,
      created_at: new Date()
    });
  });
});

// PUT update employee
app.put("/employees/:id", (req, res) => {
  const id = req.params.id;
  const { name, email, designation, salary } = req.body;

  db.query(
    "UPDATE employees SET name=?, email=?, designation=?, salary=?, updated_at=NOW() WHERE id=?",
    [name, email, designation, salary, id], // ← this last 'id' is fine, but query has 'updated_at'
    (err) => {
      if (err) return res.json(err);
      res.json({ message: "Employee updated" });
    }
  );
});



// DELETE employee
app.delete("/employees/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM employees WHERE id=?", [id], (err) => {
    if (err) return res.json(err);
    res.json({ message: "Employee deleted" });
  });
});

// Start server
app.listen(5000, () => console.log("Backend running on port 5000"));