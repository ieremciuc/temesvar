import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import session from "express-session";
import bcrypt from "bcrypt"; // for password hashing
import fs from "fs";
import path from "path";

const countryCodesPath = path.resolve("./countryCodes.json");
const countryCodes = JSON.parse(fs.readFileSync(countryCodesPath, "utf-8"));

dotenv.config(); 

const app = express();
app.set('trust proxy', 1);
app.use(cors({
  origin: "https://ieremciuc.github.io",
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "supersecretkey", // use a secure value in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // set to true if using HTTPS (e.g. on production)
    sameSite: "none",
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PORT = process.env.PORT || 3001;

// ---------------------
// 🔹 USER ROUTES
// ---------------------

// ✅ Register new user
app.post("/p_users/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    // Check if email or username already exists
    const { data: existingUser } = await supabase
      .from("p_users")
      .select("email, username")
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (existingUser)
      return res.status(400).json({ error: "Email or username already in use" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data, error } = await supabase
      .from("p_users")
      .insert([{ username, email, password: hashedPassword, created_at: new Date() }])
      .select()
      .single();

    if (error) throw error;

    res.json({ message: "User registered successfully", user: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Login user (check username/email + password)
app.post("/p_users/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password)
      return res.status(400).json({ error: "Missing credentials" });

    // Try to find user by email OR username
    const { data: user, error } = await supabase
      .from("p_users")
      .select("*")
      .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
      .single();

    if (error || !user)
      return res.status(400).json({ error: "User not found" });

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ error: "Invalid password" });

    req.session.userId = user.user_id;
    console.log("Session created:", req.session);
    // ---
    if (!req.session.userId) {
      return res.status(401).json({ loggedIn: false });
    }
    // ---

    res.json({
      message: "Login successful",
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/p_users/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ loggedIn: false });
  }
  res.json({ loggedIn: true, userId: req.session.userId });
});

app.post("/p_users/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// ---------------------
// 🔹 POST ROUTES
// ---------------------

// ✅ Get post by ID
app.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("posts")
      .select("post_id, date, like_count, dislike_count, country_name, user_id, title, content, image")
      .eq("post_id", id)
      .single();

    if (error || !data)
      return res.status(404).json({ error: "Post not found" });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Create a new post
app.post("/posts", async (req, res) => {
  try {
    const {
      date,
      like_count,
      dislike_count,
      country_name,
      user_id,
      title,
      content,
      image
    } = req.body;

    // Validate required fields
    if (!user_id || !title || !content)
      return res.status(400).json({ error: "user_id, title, and content are required" });

    // Transform country name to country code
    let country_id = null;
    if (country_name) {
      country_id = countryCodes[country_name];
      if (!country_id) {
        return res.status(400).json({ error: `Invalid country name: ${country_name}` });
      }
    }

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          date: date || new Date(),
          like_count: like_count || 0,
          dislike_count: dislike_count || 0,
          country_name,
          country_id,
          user_id,
          title,
          content,
          image
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ message: "Post created successfully", post: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------
// 🔹 REACTIONS ROUTES
// ---------------------

// ✅ Get all reactions for a post
app.get("/posts/:id/reactions", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("reactions")
      .select("reaction_id, user_id, reaction_type, created_at")
      .eq("post_id", id);

    if (error) throw error;

    res.json({ reactions: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Add or change a reaction (like/dislike)
app.post("/posts/:id/reactions", async (req, res) => {
  try {
    const { id: post_id } = req.params;
    const { user_id, reaction_type } = req.body;
    
    if (!user_id || !reaction_type)
      return res.status(400).json({ error: "user_id and reaction_type are required" });

    // Check if the user already reacted to this post
    const { data: existing } = await supabase
      .from("reactions")
      .select("reaction_id, reaction_type")
      .eq("user_id", user_id)
      .eq("post_id", post_id)
      .maybeSingle();

    if (!existing) {
      // Add new reaction
      const { data, error } = await supabase
        .from("reactions")
        .insert([{ user_id, post_id, reaction_type }])
        .select()
        .single();
      if (error) throw error;
      return res.json({ message: "Reaction added", reaction: data });
    } else if (existing.reaction_type !== reaction_type) {
      // Update reaction
      const { data, error } = await supabase
        .from("reactions")
        .update({ reaction_type })
        .eq("reaction_id", existing.reaction_id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ message: "Reaction updated", reaction: data });
    } else {
      // Same reaction exists, do nothing or optionally remove
      return res.json({ message: "Reaction already exists", reaction: existing });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Remove a reaction
app.delete("/posts/:id/reactions", async (req, res) => {
  try {
    const { id: post_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const { data, error } = await supabase
      .from("reactions")
      .delete()
      .eq("user_id", user_id)
      .eq("post_id", post_id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: "Reaction not found" });

    res.json({ message: "Reaction removed", reaction: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------
// 🔹 SERVER START
// ---------------------

app.listen(PORT, () => console.log(`Supabase API running on port ${PORT}`));
