async function main() {
  const res = await fetch('https://erp.aktu.ac.in/frmForgotPassword.aspx', {
    headers: { 'Cookie': 'AspxAutoDetectCookieSupport=1', 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  console.log('Length:', html.length);
  const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
  console.log('Images:', imgMatches);
  const links = html.match(/<a[^>]+href=["']([^"']+)["']/gi) || [];
  console.log('Links:', links.slice(0, 10));
}
main().catch(console.error);
