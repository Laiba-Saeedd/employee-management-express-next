require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authMiddleware = require("./authMiddleware");
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "64ff1e6ec4b8e42b42eb6a2d4e1ccb3627b8fc14a6e14ea28f4f6ad21094d591";

// DB Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected");
});

/* -------------------- AUTH ROUTE -------------------- */
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length === 0) return res.status(400).json({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
    console.log(token);

    res.json({ token });
  });
});

/* -------------------- EMPLOYEE ROUTES (No Auth) -------------------- */

app.get("/employees", authMiddleware, (req, res) => {
  db.query("SELECT * FROM employees ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET employee by ID
app.get("/employees/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM employees WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

// CREATE new employee
app.post("/employees", authMiddleware, (req, res) => {
  const { name, email, designation, salary } = req.body;
  const sql = "INSERT INTO employees (name, email, designation, salary, created_at) VALUES (?, ?, ?, ?, NOW())";

  db.query(sql, [name, email, designation, salary], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee added", id: result.insertId, created_at: new Date() });
  });
});

// UPDATE employee
app.put("/employees/:id", authMiddleware, (req, res) => {
  const { name, email, designation, salary } = req.body;
  const id = req.params.id;
  const sql = "UPDATE employees SET name=?, email=?, designation=?, salary=?, updated_at=NOW() WHERE id=?";
  db.query(sql, [name, email, designation, salary, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee updated" });
  });
});

// DELETE employee
app.delete("/employees/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM employees WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee deleted" });
  });
});

// Start server
app.listen(5000, () => console.log("Backend running on port 5000"));
