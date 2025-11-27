// netlify/functions/proxy.js

const handler = async (event) => {
  // 1. Quita el prefijo interno de la función
  let cleanPath = event.path.replace(/^\/\.netlify\/functions\/proxy/, "");

  // 2. Si aún queda "/api" al inicio, elimínalo para no mandarlo al backend
  if (cleanPath === "/api") {
    cleanPath = "/";
  } else if (cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.replace(/^\/api/, "");
  }

  const apiBase = process.env.API_BASE; //
  const apiKey = process.env.API_KEY; // tu clave real

  // 3. Reconstruye la query string (?limit=..., &offset=..., etc.)
  let query = "";
  if (event.rawQuery && event.rawQuery.length > 0) {
    // rawQuery ya viene como "a=1&b=2"
    query = event.rawQuery;
  } else if (event.queryStringParameters) {
    const params = new URLSearchParams(event.queryStringParameters);
    const qs = params.toString();
    if (qs) query = qs;
  }

  const pathWithQuery = query ? `${cleanPath}?${query}` : cleanPath;

  // 4. Construye la URL completa hacia la API real
  const url = `${apiBase}${pathWithQuery}`;

  // 5. Prepara las cabeceras
  const headers = {
    "X-API-KEY": apiKey,
  };

  // Transfiere Content-Type si existe
  const contentTypeHeader =
    event.headers["content-type"] || event.headers["Content-Type"];
  if (contentTypeHeader) {
    headers["Content-Type"] = contentTypeHeader;
  }

  // Evita mandar cuerpo en GET/HEAD
  const hasBody =
    event.body && event.httpMethod !== "GET" && event.httpMethod !== "HEAD";

  try {
    const res = await fetch(url, {
      method: event.httpMethod,
      headers,
      body: hasBody ? event.body : undefined,
    });

    const contentType = res.headers.get("content-type") || "application/json";
    const data = await res.text();

    return {
      statusCode: res.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      },
      body: data,
    };
  } catch (error) {
    console.error("Proxy error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error al conectar con la API" }),
    };
  }
};

export { handler };
