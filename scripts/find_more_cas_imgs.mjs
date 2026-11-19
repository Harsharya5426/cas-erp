async function checkImages() {
  const pages = [
    'https://cas.res.in/director.html',
    'https://cas.res.in/infra.html',
    'https://cas.res.in/faculty.html',
    'https://cas.res.in/index.html'
  ];
  for (const p of pages) {
    try {
      const res = await fetch(p);
      const html = await res.text();
      const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
      console.log(p, 'Found imgs:', imgs);
    } catch (e) {
      console.error(p, e.message);
    }
  }
}
checkImages();
