// Le foto di Ste per la storia della pagina di vendita (7/11): ritaglio e stesso trattamento per tutte.
// Le foto originali non stanno nel repo: U = la cartella dove sono. FOTO=<cartella> node scripts/scopri-foto.mjs
import sharp from 'sharp';
const U = process.env.FOTO || './foto-originali/';
const OUT = 'public/scopri/storia/';
// [file sorgente, nome, ritaglio {left, top, width, height}, larghezza finale]
const lista = [
  ['1a69b21a-image.jpg', 'reggiana', { left: 14, top: 14, width: 881, height: 1101 }, 720],
  ['87480724-image.jpg', 'sguardo', { left: 14, top: 0, width: 612, height: 765 }, 612],
  ['b898e2be-image.jpg', 'esultanza', { left: 30, top: 0, width: 578, height: 723 }, 578],
  ['45abecc6-image.jpg', 'tiro', { left: 0, top: 0, width: 864, height: 840 }, 840],
  ['73403eec-image.jpg', 'nazionale', { left: 250, top: 0, width: 720, height: 720 }, 720],
  ['ee754234-image.jpg', 'conduzione', { left: 0, top: 0, width: 1080, height: 1080 }, 720],
  ['ce5b8d5b-image.jpg', 'colpo-di-testa', { left: 0, top: 0, width: 869, height: 869 }, 720],
  // 10/11: due foto del Modena per la storia (il ritratto e in campo con la palla)
  ['e6b49879-image.jpg', 'modena-ritratto', { left: 0, top: 0, width: 800, height: 1200 }, 720],
  ['1dfea124-image.jpg', 'modena-palla', { left: 420, top: 0, width: 600, height: 900 }, 600],
];
// SOLO=nome1,nome2 rifà solo quelle (gli originali delle altre possono non esserci)
const solo = process.env.SOLO ? new Set(process.env.SOLO.split(',')) : null;
{
  for (const [src, nome, crop, w] of lista) {
    if (solo && !solo.has(nome)) continue;
    const base = sharp(U + src).rotate().extract(crop).resize({ width: w });
    const { width, height } = await base.clone().metadata().then(() => ({ width: w, height: Math.round(crop.height * w / crop.width) }));
    const vignetta = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="v" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".42"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`);
    await base
      .modulate({ saturation: 0.78, brightness: 0.99 })
      .linear(1.07, -7)
      .recomb([[1.05, 0.02, 0], [0, 1.0, 0], [0, 0.02, 0.92]])
      .composite([{ input: vignetta, blend: 'multiply' }])
      .webp({ quality: 78 })
      .toFile(OUT + nome + '.webp');
    console.log('ok', nome, width, height);
  }
}
