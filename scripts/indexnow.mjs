// Tells Bing (and other IndexNow search engines) which pages to recrawl.
// Run after a deploy is live:  npm run indexnow
// It reads the live sitemap, so it always submits the current page list.
// The key file is public/<KEY>.txt; Bing fetches it to confirm the site is ours.

const SITE = "https://yourdoorstepdisposal.com";
const KEY = "c0c7c63d0437eea7194fa81e06cf8850";

const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});

// 200 = accepted, 202 = accepted (key check pending). Anything else is an error.
console.log(`IndexNow: ${res.status} ${res.statusText}, ${urlList.length} URLs submitted`);
if (res.status !== 200 && res.status !== 202) {
  console.log(await res.text());
  process.exit(1);
}
