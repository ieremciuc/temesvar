import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();
app.use(cors({
  origin: "https://ieremciuc.github.io"
}));
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

// Upload image
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) return res.status(400).json({ error });
        res.json({ url: result.secure_url, public_id: result.public_id });
      }
    );
    result.end(file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete by public_id
app.delete("/delete/:public_id", async (req, res) => {
  try {
    const { public_id } = req.params;
    const result = await cloudinary.uploader.destroy(public_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Media API running on port ${PORT}`));
