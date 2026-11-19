import fs from 'node:fs';
import path from 'node:path';

const ASSETS = [
  { url: 'https://cas.res.in/images/people/dirsir.jpg', name: 'cas-director.jpg' },
  { url: 'https://cas.res.in/images/ai/ai.jpeg', name: 'cas-ai-lab.jpeg' },
  { url: 'https://cas.res.in/images/robo/Robotic-1.jpeg', name: 'cas-robotics-lab.jpeg' },
  { url: 'https://cas.res.in/images/mechalab/3D printing Lab-2.jpeg', name: 'cas-3d-lab.jpeg' },
  { url: 'https://cas.res.in/images/nano/nanofab.JPG', name: 'cas-nanofab.jpg' },
  { url: 'https://cas.res.in/images/cybercity/1.JPG', name: 'cas-cyber-center.jpg' },
  { url: 'https://cas.res.in/img/1.jpeg', name: 'cas-hall.jpeg' }
];

async function download() {
  const destDir = 'D:/ACADEMICS/ANTIGRAVITY/apps/web/public';
  for (const item of ASSETS) {
    try {
      console.log('Downloading:', item.url);
      const res = await fetch(item.url);
      if (!res.ok) {
        console.warn('Failed:', res.status, item.url);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const destPath = path.join(destDir, item.name);
      fs.writeFileSync(destPath, buffer);
      console.log('Saved:', item.name, buffer.length, 'bytes');
    } catch (e) {
      console.error('Error downloading:', item.name, e.message);
    }
  }
}

download();
