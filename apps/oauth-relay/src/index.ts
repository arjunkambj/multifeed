export default {
  fetch: (request: Request) => {
    const url = new URL(request.url);
    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET" },
      });
    }
    if (url.pathname !== "/api/oauth/callback") {
      return new Response("Not found", { status: 404 });
    }
    if (!url.search) {
      return new Response("OAuth callback ready", {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const callback = new URL("http://localhost:3000/api/oauth/callback");
    callback.search = url.search;

    return new Response(null, {
      status: 302,
      headers: {
        "Cache-Control": "no-store",
        Location: callback.toString(),
        "Referrer-Policy": "no-referrer",
      },
    });
  },
};
