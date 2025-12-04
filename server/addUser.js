const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'laiba1234',
    database: 'employee_db'
});

const username = "admin";
const password = "admin123";

bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hash],
        (err, result) => {
            if (err) throw err;
            console.log("User added:", result.insertId);
        }
    );
});
