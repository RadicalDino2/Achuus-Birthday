const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "public", "memories");
const img = /\.(jpe?g|png|gif|webp|avif)$/i;
const vid = /\.(mp4|webm|mov)$/i;

const files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => img.test(f) || vid.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  : [];

// "03-Goa trip.jpg" -> caption "Goa trip"
const list = files.map((f) => ({
  src: "memories/" + encodeURIComponent(f),
  type: vid.test(f) ? "video" : "image",
  caption: f.replace(/\.[^.]+$/, "").replace(/^\d+[\s._-]*/, "").replace(/[_-]+/g, " ").trim(),
}));

fs.writeFileSync(path.join(__dirname, "public", "memories.json"), JSON.stringify(list, null, 2));
console.log(`Found ${list.length} memories`);