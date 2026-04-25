/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // siteUrl baca dari env. Fallback ke localhost biar config gak crash di build.
  // WAJIB set NEXT_PUBLIC_APP_URL di production sebelum `next build`.
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  generateRobotsTxt: true,
  generateIndexSitemap: false, // boilerplate kecil, gak butuh sitemap-index.xml
  outDir: "public",
  sitemapSize: 45000,

  // Default per-route values (override di transform() bawah)
  changefreq: "weekly",
  priority: 0.7,

  exclude: [
    // Auth flows — gak boleh ke-index search engine
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth",
    "/auth/*",

    // Dashboard — private user area
    "/dashboard",
    "/dashboard/*",

    // Admin — private
    "/admin",
    "/admin/*",

    // API endpoints
    "/api/*",

    // PWA + service worker assets (bukan content page)
    "/manifest.webmanifest",
    "/sw.js",
    "/offline.html",

    // Internal Next.js / OG image generators
    "/_not-found",
    "/opengraph-image",
    "/twitter-image",

    // Uncomment kalau lo nanti pake server-generated sitemap
    // (e.g. dynamic blog posts atau product catalog):
    // "/server-sitemap.xml",
    // "/server-sitemap/*",
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: ["/", "/legal/"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/_next/",
          "/auth/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/legal/"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/login",
          "/register",
        ],
      },

      // Block aggressive SEO-scraper bots — saving bandwidth + competitor intel
      { userAgent: "AhrefsBot", disallow: "/" },
      { userAgent: "SemrushBot", disallow: "/" },
      { userAgent: "MJ12bot", disallow: "/" },
      { userAgent: "DotBot", disallow: "/" },
      { userAgent: "BLEXBot", disallow: "/" },
      { userAgent: "PetalBot", disallow: "/" },
      { userAgent: "DataForSeoBot", disallow: "/" },
    ],

    // Tambah additionalSitemaps di sini kalau lo punya server-generated
    // sitemap dari /api endpoint (e.g. dynamic blog posts, products, dll):
    //
    // additionalSitemaps: [
    //   `${process.env.NEXT_PUBLIC_APP_URL}/server-sitemap.xml`,
    // ],
  },

  // Per-route priority tuning. Kalau lo tambah marketing route baru
  // (e.g. /pricing standalone, /blog, /docs), tambahin tier-nya di sini.
  transform: async (config, path) => {
    let priority = config.priority;
    let changefreq = config.changefreq;

    // Tier 1 — Home (highest priority, fresh content)
    if (path === "/") {
      priority = 1.0;
      changefreq = "daily";
    }
    // Tier 2 — Legal index
    else if (path === "/legal") {
      priority = 0.6;
      changefreq = "monthly";
    }
    // Tier 3 — Legal detail pages (privacy, terms, license, dll)
    else if (path.startsWith("/legal/")) {
      priority = 0.4;
      changefreq = "monthly";
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
