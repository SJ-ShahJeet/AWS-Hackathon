import { IncomingForm } from "formidable";
import { readFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEDRA_BASE = "https://api.hedra.com/web-app/public";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.HEDRA_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({ error: "HEDRA_API_KEY not configured" });
  }

  const tmpDir = path.join(process.cwd(), "tmp");
  await mkdir(tmpDir, { recursive: true });

  const form = new IncomingForm({
    uploadDir: tmpDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
  });

  let filepath;
  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0] ?? files.file;
    if (!file?.filepath) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    filepath = file.filepath;
    const name = file.originalFilename || "avatar.png";

    const createRes = await fetch(`${HEDRA_BASE}/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ name, type: "image" }),
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Hedra create asset failed: ${createRes.status} ${errText}`);
    }
    const { id: assetId } = await createRes.json();

    const fileBuffer = await readFile(filepath);
    const mime = name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer], { type: mime }), name);

    const uploadRes = await fetch(`${HEDRA_BASE}/assets/${assetId}/upload`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Hedra upload failed: ${uploadRes.status} ${errText}`);
    }
    const asset = await uploadRes.json();
    await unlink(filepath).catch(() => {});

    res.status(200).json({
      assetId: asset.id,
      thumbnailUrl: asset.thumbnail_url || asset.asset?.url,
    });
  } catch (err) {
    if (filepath) await unlink(filepath).catch(() => {});
    console.error("Hedra upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
}
