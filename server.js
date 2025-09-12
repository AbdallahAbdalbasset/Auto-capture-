require("dotenv").config(); // load .env
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_DRIVE_FOLDER_ID,
  PORT = 3000,
} = process.env;

// ------------------ CONFIG ------------------ //
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// ------------------ OAUTH2 CLIENT ------------------ //
const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);

// Set credentials directly from refresh token
oAuth2Client.setCredentials({
  refresh_token: GOOGLE_REFRESH_TOKEN,
});

// ------------------ ROUTES ------------------ //

// Health check
app.get("/", (req, res) => res.send("Server is running 🚀"));

// Upload image to Google Drive
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    const fileMetadata = {
      name: `${Date.now()}.jpg`,
      parents: GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : [],
    };

    const media = {
      mimeType: "image/jpeg",
      body: fs.createReadStream(req.file.path),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    fs.unlinkSync(req.file.path); // cleanup temp file

    res.json({ success: true, fileId: file.data.id, link: file.data.webViewLink });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).send("Upload failed");
  }
});

// ------------------ START SERVER ------------------ //
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
