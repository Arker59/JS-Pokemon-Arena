"use strict";

import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

const JSONpath = 'data/pokemon-';
const Imgpath = 'sprites/animations/';
const numRows = 8;

async function analyzeSpriteSheet(imagePath, rows = numRows) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  const imageWidth = image.width;
  const imageHeight = image.height;
  const frameHeight = imageHeight / rows;

  const imageData = ctx.getImageData(0, 0, imageWidth, frameHeight).data;

  let activeCols = [];
  const threshold = 1;

  for (let x = 0; x < imageWidth; x++) {
    let foundOpaque = false;
    for (let y = 0; y < frameHeight; y++) {
      const index = (y * imageWidth + x) * 4;
      const alpha = imageData[index + 3];
      if (alpha > threshold) {
        foundOpaque = true;
        break;
      }
    }
    activeCols.push(foundOpaque);
  }

  let colCount = 0;
  let inFrame = false;

  for (let i = 0; i < activeCols.length; i++) {
    if (activeCols[i] && !inFrame) {
      colCount++;
      inFrame = true;
    } else if (!activeCols[i]) {
      inFrame = false;
    }
  }

  const frameWidth = Math.round(imageWidth / colCount);
  const totalFrames = colCount * rows;

  return {
    frameWidth,
    frameHeight,
    columns: colCount,
    rows,
    totalFrames
  };
}

async function main() {
  const end = 1024; 

  for (let i = 0; i <= end; i++) {
    const index = String(i).padStart(4, '0');
    const urlJSON = (JSONpath + index + '.json');
    const urlSprite = (Imgpath + index + '/Walk-Anim.png');

    try {
      if (!fs.existsSync(urlJSON) || !fs.existsSync(urlSprite)) {
        console.warn(`${index} not found`);
        continue;
      }

      const dataPokemon = JSON.parse(fs.readFileSync(urlJSON, 'utf-8'));
      const spriteInfo = await analyzeSpriteSheet(urlSprite);

      dataPokemon.sprites = {
        path: urlSprite,
        ...spriteInfo
      };

      fs.writeFileSync(urlJSON, JSON.stringify(dataPokemon, null, 2));
      console.log(`${urlJSON}`);
    } catch (err) {
      console.error(`${index}:`, err.message);
    }
  }
}

main();
