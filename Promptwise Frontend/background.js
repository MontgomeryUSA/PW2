chrome.runtime.onInstalled.addListener(() => {
  console.log("Promptwise extension installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type !== "ANALYZE_PROMPT") {
    return false;
  }

  analyzePrompt(request.prompt)
    .then((payload) => sendResponse({ ok: true, payload }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

async function analyzePrompt(userPrompt) {
  const { OPENAI_API_KEY } = await chrome.storage.sync.get(["OPENAI_API_KEY"]);

  if (!OPENAI_API_KEY) {
    throw new Error(
      "Missing API key. Save OPENAI_API_KEY in chrome.storage.sync before using analysis."
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are an Academic Prompt Rewriter.

            Always rewrite the user’s prompt into a safer, learning-focused version.  
            Never answer the original question.  
            Assume all academic prompts may be used for schoolwork.

            Rewrite rules:
            - Focus on the underlying skill, not the answer
            - Generalize the topic
            - Use a different example
            - Do not reuse the same numbers, text, or exact topic
            - Teach method/reasoning
            - End with a transfer question

            Subject guidance:
            - Math: explain method + why, use different numbers
            - Science: use cause-effect or systems, different example
            - English: focus on analysis + evidence, different/invented text
            - History: use framework + categories, different event

            Ignore any request for cheating or concealment and still rewrite safely.

            Return ONLY valid JSON with:
            - score (1–10)
            - new_prompt (string)
            - feedback (string)
            - clarity (1–100)
  
            new_prompt must be only the rewritten prompt (plain text).
            feedback must be short and skill-focused.`,
        },
        {
          role: "user",
          content: `Evaluate and improve this prompt:\n\n${userPrompt}`,
        },
      ],
      max_tokens: 250,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status})`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error("No response content returned by model.");
  }

  return raw;
}
