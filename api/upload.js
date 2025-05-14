const ImageKit = require("imagekit");
const { createClient } = require("@supabase/supabase-js");

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

module.exports = async function handler(req, res) {
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
    .filter(Boolean);
  const normalizedLocation = location.trim().toLowerCase();
  const cleanFileName = fileName.trim().toLowerCase();

  const checksum = `${safeUsername}|${cleanedTags.sort().join(",")}|${normalizedLocation}|${cleanFileName}`;
  console.log("🔍 Calculated checksum:", checksum);

  // Check for existing entry
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
      error: "This image has already been submitted."
    });
  }

  try {
    // Step 1: insert a placeholder row first (no imageUrl yet)
    const { data: insertData, error: insertError } = await supabase
      .from("submissions")
      .insert([
        {
          username: safeUsername,
          email,
          tags: cleanedTags.join(","),
          location: normalizedLocation,
          fileName: cleanFileName,
          checksum
        }
      ])
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return res.status(409).json({
          error: "This image has already been submitted."
        });
      }

      console.error("Supabase insert error:", insertError);
      return res.status(500).json({ error: "Database insert failed" });
    }

    // Step 2: now upload the image
    const response = await imagekit.upload({
      file: fileBase64,
      fileName: cleanFileName,
      folder: `hitvis/uploads/${safeUsername}`,
      tags: cleanedTags
    });

    // Step 3: update the row with the image URL
    const { error: updateError } = await supabase
      .from("submissions")
      .update({ imageUrl: response.url })
      .eq("id", insertData.id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return res.status(500).json({ error: "Failed to update image URL" });
    }

    res.status(200).json({ success: true, imageUrl: response.url });

  } catch (err) {
    console.error("Upload error:", err.message, err);
    return res.status(500).json({ error: "Upload failed: " + err.message });
  }
};
