// Función serverless de Netlify.
// Recibe el "prompt" desde el frontend, llama a la API de Anthropic usando
// la API key guardada en las variables de entorno de Netlify (nunca viaja al navegador),
// y devuelve la respuesta tal cual al frontend.

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno de Netlify." },
      }),
    };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body || "{}");
    prompt = body.prompt;
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Falta el campo 'prompt' en la solicitud.");
    }
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: { message: err.message } }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } }),
    };
  }
};
