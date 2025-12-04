require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const authMiddleware = require("./authMiddleware");

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRES_DAYS = 7; // 7 days

// DB Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected");
});

// Helper functions
function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

function hashToken(token) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(token, salt);
}

/* -------------------- AUTH ROUTES -------------------- */

// LOGIN → generate access + refresh tokens
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length === 0) return res.status(400).json({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // Access token
    const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });

    // Refresh token
    const refreshToken = generateRefreshToken();
    const hashedToken = hashToken(refreshToken);

    // Expires in 7 days
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    // Store hashed refresh token in DB
    db.query(
      "INSERT INTO refresh_tokens (userId, token, expiresAt) VALUES (?, ?, ?)",
      [user.id, hashedToken, expiresAt],
      err => {
        if (err) return res.status(500).json({ message: err.message });

        // Store refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false, // true in production
          sameSite: "strict",
          path: "/",
          maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ accessToken, refreshToken });
      }
    );
  });
});

// REFRESH → rotate refresh token and issue new access token
app.post("/auth/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

  db.query("SELECT * FROM refresh_tokens", async (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    const tokenEntry = results.find(r => bcrypt.compareSync(refreshToken, r.token));
    if (!tokenEntry) return res.status(401).json({ message: "Invalid token" });

    // Check expiry
    if (new Date(tokenEntry.expiresAt) < new Date()) {
      db.query("DELETE FROM refresh_tokens WHERE id = ?", [tokenEntry.id]);
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // Rotate tokens
    db.query("DELETE FROM refresh_tokens WHERE id = ?", [tokenEntry.id]);

    const newRefreshToken = generateRefreshToken();
    const hashedToken = hashToken(newRefreshToken);
    const newExpires = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000); // 7 days

    db.query(
      "INSERT INTO refresh_tokens (userId, token, expiresAt) VALUES (?, ?, ?)",
      [tokenEntry.userId, hashedToken, newExpires]
    );

    const newAccessToken = jwt.sign({ id: tokenEntry.userId }, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ accessToken: newAccessToken });
  });
});

// LOGOUT → delete refresh token
app.post("/auth/logout", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.clearCookie("refreshToken", { path: "/" });
    return res.json({ message: "Logged out" });
  }

  db.query("SELECT * FROM refresh_tokens", (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    const tokenEntry = results.find(r => bcrypt.compareSync(refreshToken, r.token));

    if (tokenEntry) {
      db.query("DELETE FROM refresh_tokens WHERE id = ?", [tokenEntry.id], () => {
        res.clearCookie("refreshToken", { path: "/" });
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.clearCookie("refreshToken", { path: "/" });
      res.json({ message: "Logged out" });
    }
  });
});

/* -------------------- EMPLOYEE ROUTES (Protected) -------------------- */

app.get("/employees", authMiddleware, (req, res) => {
  db.query("SELECT * FROM employees ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.get("/employees/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM employees WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

app.post("/employees", authMiddleware, (req, res) => {
  const { name, email, designation, salary } = req.body;
  const sql =
    "INSERT INTO employees (name, email, designation, salary, created_at) VALUES (?, ?, ?, ?, NOW())";

  db.query(sql, [name, email, designation, salary], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee added", id: result.insertId, created_at: new Date() });
  });
});

app.put("/employees/:id", authMiddleware, (req, res) => {
  const { name, email, designation, salary } = req.body;
  const id = req.params.id;
  const sql =
    "UPDATE employees SET name=?, email=?, designation=?, salary=?, updated_at=NOW() WHERE id=?";
  db.query(sql, [name, email, designation, salary, id], err => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee updated" });
  });
});

app.delete("/employees/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM employees WHERE id=?", [id], err => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee deleted" });
  });
});

// Start server
app.listen(5000, () => console.log("Backend running on port 5000"));
