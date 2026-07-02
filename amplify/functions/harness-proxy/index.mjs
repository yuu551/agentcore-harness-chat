import { BedrockAgentCoreClient, InvokeHarnessCommand } from "@aws-sdk/client-bedrock-agentcore";

const HARNESS_ARN = process.env.HARNESS_ARN || "";
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || "").split(",");
const REGION = process.env.AWS_REGION || "us-east-1";

const client = new BedrockAgentCoreClient({ region: REGION });

function getCorsHeaders(origin) {
  const allowed = CORS_ALLOWED_ORIGINS.includes(origin) ? origin : CORS_ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

export const handler = awslambda.streamifyResponse(async (event, responseStream, _context) => {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const corsHeaders = getCorsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    responseStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
    responseStream.end();
    return;
  }

  if (!HARNESS_ARN) {
    responseStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    responseStream.write(JSON.stringify({ error: "HARNESS_ARN not configured" }));
    responseStream.end();
    return;
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    responseStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    responseStream.write(JSON.stringify({ error: "Invalid JSON body" }));
    responseStream.end();
    return;
  }

  const claims = event.requestContext?.authorizer?.claims || {};
  const actorId = claims.sub || "";
  const sessionId = body.sessionId || crypto.randomUUID();

  const messages = body.messages || [
    { role: "user", content: [{ text: body.prompt || "" }] },
  ];

  const commandInput = {
    harnessArn: HARNESS_ARN,
    runtimeSessionId: sessionId,
    messages,
    actorId: actorId || undefined,
  };

  if (body.modelId) {
    const prefix = REGION.startsWith("ap-northeast") ? "jp" : "us";
    const modelId = body.modelId.includes(".") && !body.modelId.startsWith(prefix + ".")
      ? `${prefix}.${body.modelId}`
      : body.modelId;
    commandInput.model = { bedrockModelConfig: { modelId } };
  }

  try {
    const command = new InvokeHarnessCommand(commandInput);
    const response = await client.send(command);

    responseStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

    for await (const event of response.stream) {
      responseStream.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    responseStream.end();
  } catch (err) {
    console.error("invoke_harness error:", err);
    responseStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    responseStream.write(JSON.stringify({ error: err.message || "Internal server error" }));
    responseStream.end();
  }
});
