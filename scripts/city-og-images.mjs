// Makes the link-preview image (1200x630) for each city page, and the Trash Day SD Guide, from
// their banner photos. Run after adding or changing a city photo: node scripts/city-og-images.mjs
// Crops at the same vertical position the banner uses (photo.position in cities.ts).
import fs from "node:fs";
import sharp from "sharp";

const src = fs.readFileSync("components/residential/cities.ts", "utf8");
const cities = [...src.matchAll(/slug: "([^"]+)",[\s\S]*?photo: \{ position: "\d+% (\d+)%" \}/g)].map((m) => ({ slug: m[1], y: Number(m[2]) / 100 }));

const jobs = [
  ...cities.map((c) => ({ from: `public/residential/cities/${c.slug}.jpg`, to: `public/residential/og/${c.slug}.jpg`, y: c.y })),
  { from: "public/residential/trash-day-san-diego.jpg", to: "public/residential/og/trash-day.jpg", y: 0.55 },
];

fs.mkdirSync("public/residential/og", { recursive: true });
for (const j of jobs) {
  if (!fs.existsSync(j.from)) continue;
  const resized = sharp(j.from).resize({ width: 1200 });
  const { data, info } = await resized.toBuffer({ resolveWithObject: true });
  const W = 1200, H = 630;
  let img = sharp(data);
  if (info.height >= H) {
    img = img.extract({ left: 0, top: Math.round((info.height - H) * j.y), width: W, height: H });
  } else {
    img = sharp(data).resize({ width: W, height: H, fit: "cover" });
  }
  await img.jpeg({ quality: 82 }).toFile(j.to);
  console.log(j.to);
}
