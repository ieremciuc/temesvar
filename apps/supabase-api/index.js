import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors({
  origin: "https://ieremciuc.github.io"
}));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Example route: fetch all users
app.get("/users", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Example route: insert a new user
app.post("/users", async (req, res) => {
  const { username, email } = req.body;
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, email }])
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Supabase API running on port ${PORT}`));
