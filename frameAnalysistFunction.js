function analyze() {
  const img = document.getElementById('sprite');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageWidth = img.width;
  const imageHeight = img.height;
  const numRows = 8;
  const frameHeight = imageHeight / numRows;

  const imageData = ctx.getImageData(0, 0, imageWidth, frameHeight);
  const data = imageData.data;

  let activeCols = [];
  const threshold = 1; 

  for (let x = 0; x < imageWidth; x++) {
    let foundOpaque = false;

    for (let y = 0; y < frameHeight; y++) {
      const index = (y * imageWidth + x) * 4;
      const alpha = data[index + 3];
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

  const frameWidth = imageWidth / colCount;
  const totalFrames = colCount * numRows;

  console.log(`Detected columns: ${colCount}`);
  console.log(`Frame width: ${frameWidth}px`);
  console.log(`Total frames: ${totalFrames}`);
}


//TODO: à relier avec recuperationTest + faire une function pour vérifier les noms de pokémons de pmd collab avec les pokémons a ajouter dans l'arène (GUARD TYPE)