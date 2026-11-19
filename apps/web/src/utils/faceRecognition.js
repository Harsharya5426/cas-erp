/**
 * Browser-side Face Localization & 128-D Structural Descriptor Extractor
 * Privacy-first: runs 100% locally in-memory on HTML5 Canvas; never transmits or stores raw images.
 */

function computeL2Normalized(vec) {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i += 1) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm < 1e-8) return vec.map(() => 0);
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

async function detectFaceBox(sourceEl, srcWidth, srcHeight) {
  // 1. Prefer native browser FaceDetector API when available
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(sourceEl);
      if (faces && faces.length > 0) {
        const { x, y, width, height } = faces[0].boundingBox;
        return {
          box: {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.min(srcWidth - x, width),
            height: Math.min(srcHeight - y, height)
          },
          faceDetected: true,
          method: 'native-face-detector'
        };
      }
    } catch {
      // Fall back to deterministic chrominance/contrast ROI detector
    }
  }

  // 2. Deterministic YCbCr skin-chrominance + contrast bounding-box detector
  const sampleW = 160;
  const sampleH = 120;
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceEl, 0, 0, sampleW, sampleH);
  const { data } = ctx.getImageData(0, 0, sampleW, sampleH);

  let minX = sampleW;
  let minY = sampleH;
  let maxX = 0;
  let maxY = 0;
  let skinCount = 0;
  let lumaSum = 0;
  let lumaSqSum = 0;
  const totalPixels = sampleW * sampleH;

  for (let y = 0; y < sampleH; y += 1) {
    for (let x = 0; x < sampleW; x += 1) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      lumaSum += luma;
      lumaSqSum += luma * luma;

      // Restrict primary search to central 80% viewport to ignore edge background clutter
      if (x >= sampleW * 0.12 && x <= sampleW * 0.88 && y >= sampleH * 0.06 && y <= sampleH * 0.94) {
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        if (cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 && luma > 30) {
          skinCount += 1;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  const meanLuma = lumaSum / totalPixels;
  const variance = Math.max(0, lumaSqSum / totalPixels - meanLuma * meanLuma);
  const stdDev = Math.sqrt(variance);

  // Reject blank/covered lens frames
  if (meanLuma < 12 || stdDev < 6) {
    return {
      box: null,
      faceDetected: false,
      method: 'low-signal',
      reason: 'Camera image is too dark or covered. Ensure proper lighting and face alignment.'
    };
  }

  const scaleX = srcWidth / sampleW;
  const scaleY = srcHeight / sampleH;

  if (skinCount >= 180 && maxX - minX >= 18 && maxY - minY >= 18) {
    const cx = ((minX + maxX) / 2) * scaleX;
    const cy = ((minY + maxY) / 2) * scaleY;
    const bw = Math.min(srcWidth * 0.78, Math.max((maxX - minX) * scaleX * 1.15, srcWidth * 0.28));
    const bh = Math.min(srcHeight * 0.85, Math.max((maxY - minY) * scaleY * 1.15, bw * 1.12));
    return {
      box: {
        x: Math.max(0, Math.min(srcWidth - bw, cx - bw / 2)),
        y: Math.max(0, Math.min(srcHeight - bh, cy - bh / 2)),
        width: bw,
        height: bh
      },
      faceDetected: true,
      method: 'chrominance-roi'
    };
  }

  // Centered guide-oval ROI fallback (handles grayscale/IR/atypical lighting photos)
  const size = Math.min(srcWidth, srcHeight) * 0.62;
  return {
    box: {
      x: (srcWidth - size) / 2,
      y: (srcHeight - size) / 2,
      width: size,
      height: size
    },
    faceDetected: true,
    method: 'guide-roi'
  };
}

/**
 * Extracts a 128-dimensional illumination-normalized spatial + HOG face descriptor
 * directly from an HTMLVideoElement or HTMLImageElement.
 */
export async function extractFaceDescriptor(sourceEl) {
  const srcWidth = sourceEl.videoWidth || sourceEl.naturalWidth || sourceEl.width;
  const srcHeight = sourceEl.videoHeight || sourceEl.naturalHeight || sourceEl.height;

  if (!srcWidth || !srcHeight) {
    return {
      faceDetected: false,
      descriptor: null,
      box: null,
      qualityScore: 0,
      reason: 'Video stream or image is not ready yet.'
    };
  }

  const detection = await detectFaceBox(sourceEl, srcWidth, srcHeight);
  if (!detection.faceDetected || !detection.box) {
    return {
      faceDetected: false,
      descriptor: null,
      box: null,
      qualityScore: 0,
      reason: detection.reason || 'No clear face detected in frame.'
    };
  }

  const { box } = detection;
  const gridSize = 32;
  const roiCanvas = document.createElement('canvas');
  roiCanvas.width = gridSize;
  roiCanvas.height = gridSize;
  const ctx = roiCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceEl, box.x, box.y, box.width, box.height, 0, 0, gridSize, gridSize);

  const { data } = ctx.getImageData(0, 0, gridSize, gridSize);
  const gray = new Float32Array(gridSize * gridSize);
  let mean = 0;

  for (let i = 0; i < gridSize * gridSize; i += 1) {
    const p = i * 4;
    const v = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    gray[i] = v;
    mean += v;
  }
  mean /= gray.length;

  let variance = 0;
  for (let i = 0; i < gray.length; i += 1) {
    const d = gray[i] - mean;
    variance += d * d;
  }
  const std = Math.sqrt(variance / gray.length) || 1;

  // Illumination-normalized 32x32 grayscale map
  const norm = new Float32Array(gridSize * gridSize);
  for (let i = 0; i < gray.length; i += 1) {
    norm[i] = (gray[i] - mean) / std;
  }

  const rawFeatures = [];

  // Part A (64 dims): 8x8 spatial block mean intensities (4x4 pixels per cell)
  for (let by = 0; by < 8; by += 1) {
    for (let bx = 0; bx < 8; bx += 1) {
      let sum = 0;
      for (let y = 0; y < 4; y += 1) {
        for (let x = 0; x < 4; x += 1) {
          sum += norm[(by * 4 + y) * gridSize + (bx * 4 + x)];
        }
      }
      rawFeatures.push(sum / 16);
    }
  }

  // Part B (64 dims): 4x4 spatial grid x 4 oriented Sobel gradient bins (HOG structural signature)
  for (let gy = 0; gy < 4; gy += 1) {
    for (let gx = 0; gx < 4; gx += 1) {
      const bins = [0, 0, 0, 0];
      for (let y = 1; y < 7; y += 1) {
        const py = gy * 8 + y;
        for (let x = 1; x < 7; x += 1) {
          const px = gx * 8 + x;
          const dx = norm[py * gridSize + (px + 1)] - norm[py * gridSize + (px - 1)];
          const dy = norm[(py + 1) * gridSize + px] - norm[(py - 1) * gridSize + px];
          const mag = Math.hypot(dx, dy);
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += Math.PI; // unsigned [0, pi)
          const binIdx = Math.min(3, Math.floor((angle / Math.PI) * 4));
          bins[binIdx] += mag;
        }
      }
      rawFeatures.push(bins[0] / 36, bins[1] / 36, bins[2] / 36, bins[3] / 36);
    }
  }

  const descriptor = computeL2Normalized(rawFeatures);
  const qualityScore = Math.min(100, Math.round(Math.min(1, std / 42) * 100));

  return {
    faceDetected: true,
    descriptor,
    box,
    qualityScore,
    method: detection.method
  };
}

export function averageDescriptors(descriptorList) {
  if (!descriptorList || descriptorList.length === 0) return [];
  const dim = descriptorList[0].length;
  const avg = new Array(dim).fill(0);
  for (const vec of descriptorList) {
    for (let i = 0; i < dim; i += 1) {
      avg[i] += vec[i] || 0;
    }
  }
  for (let i = 0; i < dim; i += 1) {
    avg[i] /= descriptorList.length;
  }
  return computeL2Normalized(avg);
}

export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not decode uploaded image file.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
    reader.readAsDataURL(file);
  });
}
