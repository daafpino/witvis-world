import ImageKit from "imagekit";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { fileBase64, fileName, username = "anonymous", tags = "", location = "", email = "" } = req.body;

  if (!fileBase64 || !fileName || !email || !tags) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const safeUsername = username.replace(/[^a-z0-9_-]/gi, '').toLowerCase();

  try {
    const response = await imagekit.upload({
      file: fileBase64,
      fileName,
      folder: `hitvis/uploads/${safeUsername}`,
      tags: tags.split(',').map(tag => tag.trim()),
    });

    res.status(200).json({ success: true, imageUrl: response.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
}
