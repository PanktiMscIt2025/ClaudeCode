// Minimal stand-in for the Anthropic Messages API and the Gemini generateContent API, used by
// `npm run test:e2e:ai` and `npm run test:e2e:gemini`. It checks that requests have the shape
// lib/server/ai.ts must send (API key, structured-output schema, and for Claude the refusal-fallback
// beta) and answers with schema-valid JSON, so each AI code path is tested end-to-end without a real
// key or network access.
import http from "node:http";

export const calls = [];

function reply(schema, prompt) {
  const props = schema?.properties ?? {};
  if (props.topics) {
    return { topics: ["ER modelling", "SQL joins and subqueries", "Normalization (1NF to BCNF)", "Transactions and concurrency control"], outcomes: ["CO1: Design a conceptual data model", "CO2: Write correct SQL"] };
  }
  if (props.rubric && props.questions) {
    return {
      rubric: [
        { criterion: "Design", maxMarks: 12, description: "Sound model" },
        { criterion: "SQL", maxMarks: 12, description: "Correct queries" },
        { criterion: "Clarity", maxMarks: 6, description: "Clear report" },
      ],
      questions: [
        { marks: 10, learningOutcome: "CO1", skill: "ER modelling", deliverable: "report.docx" },
        { marks: 12, learningOutcome: "CO2", skill: "SQL joins", deliverable: "queries.sql" },
        { marks: 8, learningOutcome: "CO1", skill: "Normalization", deliverable: "report.docx" },
      ],
    };
  }
  if (props.versions) {
    const keys = (/student keys: ([^.\n]+)\./.exec(prompt)?.[1] ?? "S1").split(",").map((k) => k.trim());
    const domains = ["tea estate", "metro rail depot", "blood bank", "esports league", "spice exporter", "ferry service", "orphanage", "cricket academy"];
    return {
      versions: keys.map((key, i) => {
        const d = domains[(calls.length * 3 + i) % domains.length];
        return {
          key,
          title: `Mock ${d} ${key}`,
          domain: d,
          scenario: `A ${d} with ${10 + i * 7} sites needs a database. Unique detail ${key}-${calls.length}: ${"constraint ".repeat(i + 1)}`.repeat(3),
          questions: [1, 2, 3].map((n) => ({ number: n, text: `Q${n} for the ${d}: apply the topic to case ${key}-${n}.`, marks: 10, deliverable: n === 2 ? "queries.sql" : "report.docx" })),
          instructions: "Submit one ZIP with report.docx and queries.sql.",
          modelSolution: [1, 2, 3].map((n) => ({ question: n, answer: `Model answer ${n} for ${d}`, keyPoints: ["point a", "point b"] })),
        };
      }),
    };
  }
  if (props.readable) {
    return {
      readable: true,
      criteria: [
        { criterion: "Design", marks: 10, comment: "Good ER model" },
        { criterion: "SQL", marks: 9.5, comment: "LEFT JOIN used well" },
        { criterion: "Clarity", marks: 99, comment: "Over max on purpose: the app must clamp this" },
      ],
      feedback: "Mock evaluation: solid work overall.",
      evidence: ["queries.sql: LEFT JOIN batch"],
      reviewReason: "",
    };
  }
  throw new Error("Unknown schema: " + JSON.stringify(Object.keys(props)));
}

export function startMock(port) {
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        if (req.method !== "POST") throw new Error(`Unexpected ${req.method} ${req.url}`);
        const json = JSON.parse(body);
        const fail = (problems) => {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", code: 400, message: problems.join("; ") } }));
        };

        // Google Gemini: POST /v1beta/models/{model}:generateContent
        const gem = /\/models\/([^/:]+):generateContent/.exec(req.url);
        if (gem) {
          const cfg = json.generationConfig ?? {};
          const problems = [];
          if (!req.headers["x-goog-api-key"]) problems.push("missing x-goog-api-key");
          if (cfg.responseMimeType !== "application/json") problems.push("responseMimeType must be application/json");
          if (!cfg.responseJsonSchema?.properties) problems.push("missing responseJsonSchema");
          if (!json.systemInstruction) problems.push("missing systemInstruction");
          if (problems.length) return fail(problems);
          const prompt = (json.contents ?? []).flatMap((c) => c.parts ?? []).map((p) => p.text ?? "").join("\n");
          const out = reply(cfg.responseJsonSchema, prompt);
          calls.push({ model: gem[1], kind: Object.keys(cfg.responseJsonSchema.properties)[0], provider: "gemini" });
          res.writeHead(200, { "content-type": "application/json" });
          return res.end(
            JSON.stringify({
              candidates: [{ content: { role: "model", parts: [{ text: JSON.stringify(out) }] }, finishReason: "STOP", index: 0 }],
              usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200, totalTokenCount: 300 },
              modelVersion: gem[1],
            }),
          );
        }

        // Anthropic Messages API
        if (!req.url.startsWith("/v1/messages")) throw new Error(`Unexpected ${req.method} ${req.url}`);
        const problems = [];
        if (!req.headers["x-api-key"]) problems.push("missing x-api-key");
        if (!String(req.headers["anthropic-beta"] ?? "").includes("server-side-fallback-2026-07-01")) problems.push("missing fallback beta header");
        if (json.fallbacks !== "default") problems.push("fallbacks must be 'default'");
        if (json.output_config?.format?.type !== "json_schema") problems.push("missing structured output schema");
        if (!json.output_config?.effort) problems.push("effort not set");
        if (json.thinking?.type === "disabled") problems.push("thinking must not be disabled");
        if (problems.length) return fail(problems);
        const prompt = json.messages.map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content))).join("\n");
        const out = reply(json.output_config.format.schema, prompt);
        calls.push({ model: json.model, kind: Object.keys(json.output_config.format.schema.properties ?? {})[0], provider: "anthropic" });
        res.writeHead(200, { "content-type": "application/json", "request-id": "req_mock" });
        res.end(
          JSON.stringify({
            id: `msg_mock_${calls.length}`,
            type: "message",
            role: "assistant",
            model: json.model,
            content: [{ type: "text", text: JSON.stringify(out) }],
            stop_reason: "end_turn",
            stop_sequence: null,
            usage: { input_tokens: 100, output_tokens: 200 },
          }),
        );
      } catch (e) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ type: "error", error: { type: "api_error", message: String(e) } }));
      }
    });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}
