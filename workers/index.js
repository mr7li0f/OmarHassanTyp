export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://omarhassantype.dev",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/auth") {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=3dd82a51679931bddca847da80c17bbd94c2e27f&scope=repo&redirect_uri=${encodeURIComponent(url.origin + "/callback")}`;
      return Response.redirect(githubAuthUrl, 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing code", { status: 400 });

      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: "3dd82a51679931bddca847da80c17bbd94c2e27f",
          client_secret: "Ov23lirjegDyp9up0m7k",
          code: code,
        }),
      });

      const data = await response.json();
      
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <script>
            const message = ${JSON.stringify({
              authorizing: true,
              provider: "github",
              token: data.access_token,
              error: data.error
            })};
            window.opener.postMessage(JSON.stringify(message), window.location.origin);
          </script>
        </body>
        </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Not Found", { status: 404 });
  }
};
