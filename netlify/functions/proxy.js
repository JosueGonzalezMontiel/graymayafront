// netlify/functions/proxy.js
const handler = async (event) => {
  // Extrae el path después de /api
  const path = event.path.replace(/^\/\.netlify\/functions\/proxy/, "");
  const apiBase = process.env.API_BASE; // https://api.graymaya.shop
  const apiKey = process.env.API_KEY; // tu clave real

  // Construye la URL completa hacia la API real
  const url = `${apiBase}${path}`;

  // Prepara las cabeceras
  const headers = {
    "X-API-KEY": apiKey,
  };

  // Transfiere Content-Type si existe
  if (event.headers["content-type"]) {
    headers["Content-Type"] = event.headers["content-type"];
  }

  try {
    const res = await fetch(url, {
      method: event.httpMethod,
      headers: headers,
      body: event.body || undefined,
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
