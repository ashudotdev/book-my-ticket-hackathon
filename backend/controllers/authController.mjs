import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.mjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const PASSWORD_RULE_MESSAGE = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";

function isStrongPassword(password) {
  return typeof password === "string"
    && password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: PASSWORD_RULE_MESSAGE });
    }

    // Check if user exists
    const checkUserSql = "SELECT id FROM users WHERE email = $1";
    const userExistResult = await pool.query(checkUserSql, [email]);
    
    if (userExistResult.rowCount > 0) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insertSql = "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id";
    await pool.query(insertSql, [name, email, hashedPassword]);

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const userSql = "SELECT * FROM users WHERE email = $1";
    const userResult = await pool.query(userSql, [email]);

    if (userResult.rowCount === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
