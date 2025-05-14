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
  const cleanedTags = tags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean); // remove empty tags
  const normalizedLocation = location.trim().toLowerCase();

  // Create a checksum to detect duplicates
  const checksum = `${safeUsername}|${cleanedTags.sort().join(",")}|${normalizedLocation}|${fileName}`;

  // Check for duplicates
  const { data: existing, error: fetchError } = await supabase
    .from("submissions")
    .select("id")
    .eq("checksum", checksum);

  if (fetchError) {
    console.error("Supabase fetch error:", fetchError);
    return res.status(500).json({ error: "Database query failed" });
  }

  if (existing && existing.length > 0) {
    return res.status(409).json({
      error: "You've already submitted this image with the same tags and location."
    });
  }

  try {
    // Upload to ImageKit
    const response = await imagekit.upload({
      file: fileBase64,
      fileName,
      folder: `hitvis/uploads/${safeUsername}`,
      tags: cleanedTags
    });

    // Insert metadata into Supabase
    const { error } = await supabase.from("submissions").insert([
      {
        imageUrl: response.url,
        username: safeUsername,
        email,
        tags: cleanedTags.join(","), // Store as comma-separated string
