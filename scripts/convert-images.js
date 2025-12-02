// Script para convertir imágenes a WebP y generar varios tamaños
// Requiere: npm i sharp
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputDir = path.join(__dirname, "..", "public", "img", "productos");
const sizes = [400, 800, 1200];

if (!fs.existsSync(inputDir)) {
  console.error("No existe el directorio de imágenes:", inputDir);
  process.exit(1);
}

fs.readdirSync(inputDir).forEach((file) => {
  const ext = path.extname(file).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) return;
  const full = path.join(inputDir, file);
  const name = path.parse(file).name;
  sizes.forEach((sz) => {
    const out = path.join(inputDir, `${name}-${sz}.webp`);
    sharp(full)
      .resize(sz)
      .webp({ quality: 80 })
      .toFile(out)
      .then(() => console.log("Generado:", out))
      .catch((err) => console.error("Error procesando", full, err));
  });
});

console.log("Procesamiento iniciado.");
