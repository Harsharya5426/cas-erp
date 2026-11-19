import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('C:/Users/Harsh Arya/.gemini/antigravity/brain/d49240e5-bb0d-4fa1-a0fc-16d39cc6cdd0/scratch/cas_data.json', 'utf8'));
console.log('Director:', typeof data.director, JSON.stringify(data.director).slice(0, 300));
console.log('Labs:', typeof data.labs, JSON.stringify(data.labs).slice(0, 300));
console.log('Faculty:', typeof data.faculty, Array.isArray(data.faculty) ? data.faculty.length : typeof data.faculty);
