const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const fetch = require('node-fetch');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Create a UGC-style product demonstration video
 * Combines D-ID avatar with product images in various layouts
 */
async function createHybridUGCVideo(options) {
  const {
    avatarVideoPath,    // Path to D-ID avatar video
    productImages,      // Array of product image URLs
    outputPath,         // Output video path
    style = 'splitScreen', // Video style: splitScreen, pictureInPicture, slideshow
    productName = 'Product',
    duration = 30       // Video duration in seconds
  } = options;

  console.log(`Creating hybrid UGC video with style: ${style}`);

  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    switch (style) {
      case 'splitScreen':
        return await createSplitScreenVideo(avatarVideoPath, productImages, outputPath, productName);
      
      case 'pictureInPicture':
        return await createPictureInPictureVideo(avatarVideoPath, productImages, outputPath, productName);
      
      case 'slideshow':
        return await createSlideshowVideo(avatarVideoPath, productImages, outputPath, duration);
      
      default:
        return await createSplitScreenVideo(avatarVideoPath, productImages, outputPath, productName);
    }
  } catch (error) {
    console.error('Video composition error:', error);
    throw error;
  }
}

/**
 * Split screen: Avatar on left, product images on right
 */
async function createSplitScreenVideo(avatarVideo, productImages, outputPath, productName) {
  return new Promise((resolve, reject) => {
    console.log('Creating split-screen UGC video...');
    
    // Create a canvas image with product collage for the right side
    createProductCollage(productImages, productName).then(collagePath => {
      
      const command = ffmpeg()
        .input(avatarVideo)
        .input(collagePath)
        .complexFilter([
          // Scale avatar to left half (640x720)
          '[0:v]scale=640:720[avatar]',
          // Scale product collage to right half (640x720)
          '[1:v]scale=640:720[product]',
          // Combine side by side
          '[avatar][product]hstack=inputs=2[out]'
        ])
        .outputOptions([
          '-map', '[out]',
          '-map', '0:a?',  // Include audio from avatar video if exists
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '128k'
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('FFmpeg command:', cmd);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${Math.round(progress.percent || 0)}% done`);
        })
        .on('end', () => {
          console.log('Split-screen video created successfully');
          // Clean up temp collage
          if (fs.existsSync(collagePath)) {
            fs.unlinkSync(collagePath);
          }
          resolve({
            success: true,
            path: outputPath,
            style: 'splitScreen'
          });
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          // Clean up temp collage
          if (fs.existsSync(collagePath)) {
            fs.unlinkSync(collagePath);
          }
          reject(err);
        })
        .run();
    }).catch(reject);
  });
}

/**
 * Picture-in-Picture: Product image with avatar overlay
 */
async function createPictureInPictureVideo(avatarVideo, productImages, outputPath, productName) {
  return new Promise((resolve, reject) => {
    console.log('Creating picture-in-picture UGC video...');
    
    // Use first product image as background
    const productImage = productImages[0]?.url || productImages[0];
    
    const command = ffmpeg()
      .input(productImage)
      .loop(30) // Loop the image for 30 seconds
      .input(avatarVideo)
      .complexFilter([
        // Scale product image to full size (1280x720)
        '[0:v]scale=1280:720[bg]',
        // Scale avatar to smaller size and position in corner
        '[1:v]scale=320:240[pip]',
        // Overlay avatar on bottom right
        '[bg][pip]overlay=W-w-20:H-h-20[out]'
      ])
      .outputOptions([
        '-map', '[out]',
        '-map', '1:a?',  // Include audio from avatar video
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest'  // End when shortest input ends
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('Picture-in-picture video created successfully');
        resolve({
          success: true,
          path: outputPath,
          style: 'pictureInPicture'
        });
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Slideshow: Avatar audio with product images cycling
 */
async function createSlideshowVideo(avatarVideo, productImages, outputPath, duration) {
  return new Promise((resolve, reject) => {
    console.log('Creating slideshow UGC video...');
    
    const imageDuration = duration / productImages.length;
    
    let filterComplex = '';
    let inputs = ffmpeg();
    
    // Add avatar video for audio
    inputs.input(avatarVideo);
    
    // Add each product image
    productImages.forEach((img, i) => {
      const imageUrl = img.url || img;
      inputs.input(imageUrl).loop(imageDuration);
      
      // Scale each image
      filterComplex += `[${i+1}:v]scale=1280:720,setsar=1,format=yuv420p[img${i}];`;
    });
    
    // Create crossfade transitions between images
    let concatFilter = '';
    productImages.forEach((_, i) => {
      concatFilter += `[img${i}]`;
    });
    concatFilter += `concat=n=${productImages.length}:v=1:a=0[out]`;
    
    filterComplex += concatFilter;
    
    inputs
      .complexFilter(filterComplex)
      .outputOptions([
        '-map', '[out]',
        '-map', '0:a?',  // Audio from avatar video
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest'
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('Slideshow video created successfully');
        resolve({
          success: true,
          path: outputPath,
          style: 'slideshow'
        });
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Create a product collage image
 */
async function createProductCollage(productImages, productName) {
  const width = 640;
  const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 0, width, height);
  
  // Add product name at top
  ctx.fillStyle = '#333';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(productName, width/2, 50);
  
  // Add product images in grid
  const maxImages = Math.min(4, productImages.length);
  const gridSize = maxImages <= 2 ? 1 : 2;
  const imgSize = 280;
  const padding = 20;
  
  for (let i = 0; i < maxImages; i++) {
    try {
      const imgUrl = productImages[i]?.url || productImages[i];
      const response = await fetch(imgUrl);
      const buffer = await response.buffer();
      const img = await loadImage(buffer);
      
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = padding + col * (imgSize + padding);
      const y = 100 + row * (imgSize + padding);
      
      // Draw image with border
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.strokeRect(x-1, y-1, imgSize+2, imgSize+2);
      ctx.drawImage(img, x, y, imgSize, imgSize);
      
    } catch (err) {
      console.error(`Failed to load image ${i}:`, err);
    }
  }
  
  // Add call-to-action at bottom
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('Shop Now!', width/2, height - 40);
  
  // Save canvas to temp file
  const tempPath = path.join('generated-videos', `temp_collage_${Date.now()}.png`);
  const out = fs.createWriteStream(tempPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  
  return new Promise((resolve) => {
    out.on('finish', () => resolve(tempPath));
  });
}

/**
 * Add text overlay to video
 */
async function addTextOverlay(videoPath, text, position = 'bottom', outputPath) {
  return new Promise((resolve, reject) => {
    const drawtext = `drawtext=text='${text}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=${position === 'top' ? '50' : 'h-100'}`;
    
    ffmpeg(videoPath)
      .videoFilters(drawtext)
      .output(outputPath)
      .on('end', () => {
        console.log('Text overlay added');
        resolve(outputPath);
      })
      .on('error', reject)
      .run();
  });
}

module.exports = {
  createHybridUGCVideo,
  createSplitScreenVideo,
  createPictureInPictureVideo,
  createSlideshowVideo,
  addTextOverlay
};