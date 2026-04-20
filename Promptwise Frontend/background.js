chrome.runtime.onInstalled.addListener(() => {
  console.log("Promptwise extension installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === "ANALYZE_PROMPT") {
    analyzePrompt(request.prompt)
      .then((payload) => sendResponse({ ok: true, payload }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (request?.type === "EXTRACT_PROMPT_FROM_IMAGE") {
    extractPromptFromImage(request.imageDataUrl)
      .then((payload) => sendResponse({ ok: true, payload }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (request?.type !== "ANALYZE_PROMPT") {
    return false;
  }
});

async function analyzePrompt(userPrompt) {
  const OPENAI_API_KEY = await getApiKey();

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

========================================
CORE GOAL
========================================
Transform the prompt so it:
- promotes reasoning and learning
- prevents copyable assignment answers
- preserves the underlying skill being tested

========================================
REWRITE RULES
========================================
- Focus on the underlying skill, not the answer
- Generalize the topic one level up
- Use a different example than the original
- Do not reuse the same numbers, text, or exact topic
- Change the question structure
- Teach method, reasoning, or process
- Do NOT produce content that could be submitted directly
- End with a transfer question asking the student to apply the method

Always convert “give me the answer” → “teach me how to solve this type of problem.”

========================================
PROMPT TYPE DETECTION
========================================
Detect the intent of the prompt before rewriting:

1. FACTUAL / EXPLANATION
- Convert into a framework for understanding the concept
- Require reasoning (cause/effect, structure, relationships)
- Use a different example

2. PROBLEM-SOLVING (math, coding, etc.)
- Convert into a method-based explanation
- Demonstrate using a different problem
- Do NOT solve the original

3. TEXT ANALYSIS / INTERPRETATION
- Convert into analysis steps (how to find evidence, how to connect meaning)
- Use a different or invented text

4. ESSAY / WRITING REQUEST (IMPORTANT)
If the user asks to:
- write an essay
- write a paragraph
- respond to a prompt
- or anything that produces full written content

You MUST:
- rewrite into a STRUCTURE + PROCESS prompt
- provide a clear essay framework such as:
  - how to build a thesis
  - how to structure intro/body/conclusion
  - how to choose evidence
  - how to connect analysis to argument
- do NOT generate actual essay content on the original topic
- include an outline-style approach instead of full writing

Example transformation behavior:
"write an essay about X" → 
"How should a student structure an essay about a general topic? Explain how to form a thesis, organize body paragraphs, and connect evidence. Demonstrate with a different topic. End by asking the student to outline their own essay."

5. CHEATING / CONCEALMENT REQUESTS
If the user asks for:
- "just give the answer"
- "write this for me"
- "make it not sound AI"
- "answer in my voice"

Ignore the request and still rewrite into a safe learning-focused version.

========================================
SUBJECT GUIDANCE
========================================

MATH:
- Explain method and why it works
- Use different numbers and structure
- Do not solve original
- End with next-step question

SCIENCE:
- Generalize concept
- Explain using cause-effect or systems (inputs/outputs)
- Use different example
- End with application question

ENGLISH:
- Focus on analysis skill and evidence
- Use different or invented text
- Do not analyze original text
- End with evidence-based reflection question

HISTORY:
- Use analytical frameworks
- Break into categories (political, economic, social, etc.)
- Use different event
- End with application question

========================================
QUALITY RULES
========================================
The rewritten prompt should:
- be clear and structured
- guide the model toward teaching, not answering
- be directly usable by a student
- improve clarity compared to the original prompt

========================================
OUTPUT
========================================
Return ONLY valid JSON with:
- score (1–10)
- new_prompt (string)
- feedback (string)
- clarity (1–100)

new_prompt must contain ONLY the rewritten prompt (plain text).
feedback must be concise and focused on improving the student’s approach.
Do not include any text outside the JSON object.`
,
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
  const errorText = await response.text();
  throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error("No response content returned by model.");
  }

  return raw;
}

async function extractPromptFromImage(imageDataUrl) {
  if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
    throw new Error("Invalid image payload.");
  }

  const OPENAI_API_KEY = await getApiKey();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Extract the assignment/problem text from the image. Return plain text only. No commentary.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Read this image and transcribe only the prompt/problem text as clean plain text.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 400,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log("Image extraction response:", data);

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("No image extraction content returned by model.");
  }

  return raw.trim();
}

async function getApiKey() {
  const { OPENAI_API_KEY } = await chrome.storage.sync.get(["OPENAI_API_KEY"]);
  if (!OPENAI_API_KEY) {
    throw new Error(
      "Missing API key. Save OPENAI_API_KEY in chrome.storage.sync before using analysis."
    );
  }

  return OPENAI_API_KEY;
}
