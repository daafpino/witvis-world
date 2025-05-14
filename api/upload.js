import ImageKit from "imagekit";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
};

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const {
    fileBase64,
    fileName,
    username = "anonymous",
    tags = "",
    location = "",
    email = ""
  } = req.body;

  if (!fileBase64 || !fileName || !email || !tags) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const safeUsername = username.replace(/[^a-z0-9_-]/gi, "").toLowerCase();

  try {
    // Upload to ImageKit
    const response = await imagekit.upload({
      file: fileBase64,
      fileName,
      folder: `hitvis/uploads/${safeUsername}`,
      tags: tags.split(",").map((tag) => tag.trim())
    });

    // Insert metadata into Supabase
    const { error } = await supabase.from("submissions").insert([
      {
        imageUrl: response.url,
        username: safeUsername,
        email,
        tags,
        location
        // uploadedAt is auto-filled by Supabase
      }
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Database insert failed" });
    }

    res.status(200).json({ success: true, imageUrl: response.url });

  } catch (err) {
    console.error("Upload error:", err.message, err);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
}
