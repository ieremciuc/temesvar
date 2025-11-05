import express from "express";
import multer from "multer";
import cors from "cors";
import cloudinary from "./config.js";

const app = express();
// app.use(cors());
app.use(cors({
  origin: "https://ieremciuc.github.io"
}));

app.use(express.json());

// Multer setup for temporary storage
const upload = multer({ dest: "uploads/" });

// Upload file to Cloudinary
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "temesvar"
    });

    res.json({
      public_id: result.public_id,
      secure_url: result.secure_url
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// app.get("/", (req, res) => {
//   res.send("Media API is running!");
// });

// Fetch file info by public_id
app.get("/file/:public_id", async (req, res) => {
  try {
    const { public_id } = req.params;
    const info = await cloudinary.api.resource(public_id);
    res.json(info);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "File not found" });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Media API running on port ${PORT}`));
