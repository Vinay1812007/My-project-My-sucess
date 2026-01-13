export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let path = url.pathname;

    // Normalize paths
    if (path === "/" || path === "/home") {
      path = "/index.html";
    } else if (path === "/music") {
      path = "/music.html";
    } else if (path === "/chat.ai") {
      path = "/ai.html";
    } else if (path === "/VI Messeger") {
      path = "/chatgram.html";
    } else if (path === "/videodownloder") {
      path = "/videodownloader.html";
    } else if (path === "/sitemap") {
      path = "/sitemap.html";
    }

    // Fetch static asset from Pages
    return fetch(new Request(url.origin + path, request));
  }
};
