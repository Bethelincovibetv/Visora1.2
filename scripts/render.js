const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Render Script for Vixora Flyer-to-Video Ad Pipeline
 * Usage: node scripts/render.js <job_id> <input_data_path> <output_path>
 */

async function render() {
  const [,, jobId, inputDataPath, outputPath] = process.argv;

  if (!jobId || !inputDataPath || !outputPath) {
    console.error('Usage: node scripts/render.js <job_id> <input_data_path> <output_path>');
    process.exit(1);
  }

  const jobDir = path.join(__dirname, '../temp', jobId);
  console.log(`[${jobId}] Initializing rendering pipeline...`);

  try {
    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });

    // 1. Initialize Playwright
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log(`[${jobId}] Processing flyer visuals...`);
    // Note: In production, load the specific FlyerCanvasRenderer logic via a local URL or data injection
    await page.goto(`file://${path.join(__dirname, '../index.html')}`);
    
    // 2. Render frames (simulation of visual capture)
    const framesDir = path.join(jobDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });
    
    // Assume logic to capture frame buffer here
    // await page.screenshot({ path: path.join(framesDir, 'frame_%04d.png') });
    
    await browser.close();

    // 3. Use FFmpeg to combine
    console.log(`[${jobId}] Compiling video with FFmpeg...`);
    const audioPath = path.join(jobDir, 'audio.mp3');
    const cmd = `ffmpeg -framerate 24 -i ${framesDir}/frame_%04d.png -i ${audioPath} -c:v libx264 -pix_fmt yuv420p -c:a aac ${outputPath}`;
    
    execSync(cmd, { stdio: 'inherit' });

    console.log(`[${jobId}] Successfully rendered: ${outputPath}`);

  } catch (err) {
    console.error(`[${jobId}] Rendering failed:`, err.message);
    process.exit(1);
  } finally {
    // 4. Cleanup
    if (fs.existsSync(jobDir)) {
      console.log(`[${jobId}] Cleaning up job directory...`);
      fs.rmSync(jobDir, { recursive: true, force: true });
    }
  }
}

render();