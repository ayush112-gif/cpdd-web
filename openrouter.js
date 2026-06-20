const OpenAI = require("openai");

// We keep the OpenAI client only for type-compat in a couple of helper
// spots, but the actual network call below uses raw fetch — Render's
// network has been truncating the SDK's gzip-decoded streaming responses
// mid-transfer (ERR_STREAM_PREMATURE_CLOSE), so we bypass that path
// entirely and do a plain, non-streaming JSON request ourselves.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function rawChatCompletion({ model, temperature, max_tokens, messages }) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      // Ask the server not to gzip the response — avoids the truncated
      // gzip stream issue seen on Render's network.
      "Accept-Encoding": "identity",
    },
    body: JSON.stringify({
      model,
      temperature: temperature ?? 0,
      max_tokens: max_tokens ?? 800,
      stream: false,
      messages,
    }),
  });

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    const err = new Error("Invalid JSON response from OpenRouter");
    err.status = res.status;
    err.cause = parseErr;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data?.error?.message || `OpenRouter error (status ${res.status})`);
    err.status = res.status;
    err.error = data?.error;
    throw err;
  }

  return data;
}

// Confirmed free models — June 2026 (verified against openrouter.ai/collections/free-models)
const TEXT_MODELS = [
  "openrouter/owl-alpha",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nex-agi/nex-n2-pro:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-4-31b:free",
];

const VISION_MODELS = [
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "google/gemma-4-31b:free",
  "nex-agi/nex-n2-pro:free",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Errors that are transient/network-level and worth retrying on the
// same or next model, rather than failing immediately.
function isRetryableNetworkError(err) {
  const code = err.code || err.cause?.code;
  const type = err.type || err.cause?.type;
  const message = err.message || "";

  return (
    code === "ERR_STREAM_PREMATURE_CLOSE" ||
    type === "system" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    message.includes("Premature close") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    err.name === "APIConnectionTimeoutError" ||
    err.name === "APIConnectionError" ||
    err.name === "TypeError"
  );
}

async function callWithRetry(buildMessages, modelList, maxAttempts = 10) {
  let lastErr = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = modelList[attempt % modelList.length];
    try {
      const { messages, max_tokens, temperature } = buildMessages(model);
      const data = await rawChatCompletion({ model, temperature, max_tokens, messages });
      if (!data.choices || !data.choices[0]) {
        throw new Error("No choices returned from model");
      }
      return data;
    } catch (err) {
      lastErr = err;
      const status = err.status;

      // Skip unavailable/paid models immediately, try next
      if (status === 404) {
        console.log(`Model ${model} not available free, trying next...`);
        continue;
      }

      if (status === 429 || status === 503) {
        const wait = Math.min((err.error?.metadata?.retry_after_seconds || 5) * 1000, 10000);
        console.log(`Rate limited on ${model}, waiting ${Math.ceil(wait / 1000)}s...`);
        await sleep(wait);
        continue;
      }

      if (isRetryableNetworkError(err)) {
        console.log(`Network/stream error on ${model} (${err.code || err.message}), retrying in 2s...`);
        await sleep(2000);
        continue;
      }

      throw err;
    }
  }

  throw lastErr || new Error("All models exhausted, try again later.");
}

async function extractJobDetails(text) {
  try {
    const response = await callWithRetry((model) => ({
      temperature: 0,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are an expert placement and recruitment analyst. Your top priority is COMPLETENESS — extract every single concrete fact present in the notification. Missing a number, date, condition, or instruction is a serious error.

Extract information from the given job notification and return ONLY valid JSON with this exact schema:
{
  "company_name": "",
  "role": "",
  "job_type": "",
  "batch": "",
  "location": "",
  "work_mode": "",
  "work_location_address": "",
  "ctc": "",
  "base_salary": "",
  "joining_bonus": "",
  "retention_bonus": "",
  "stock_options": "",
  "internship_stipend": "",
  "internship_duration": "",
  "ppo_package": "",
  "salary_breakdown": [],
  "bond_details": "",
  "eligibility": "",
  "branches": [],
  "eligible_courses": [],
  "minimum_cgpa": "",
  "skills_required": [],
  "selection_process": [],
  "assessment_details": "",
  "programming_languages": [],
  "job_description": "",
  "application_link": "",
  "deadline": "",
  "deadline_time": "",
  "test_date": "",
  "interview_date": "",
  "joining_date": "",
  "contact_email": "",
  "contact_person": "",
  "contact_phone": "",
  "important_instructions": [],
  "summary": ""
}

Field Guidance:
- "batch": eligible pass-out batch/year (e.g. "2026", "2027"), exactly as stated.
- "work_location_address": specific office address if different from general "location" (e.g. "Plot 861, Udyog Vihar Phase 5, Gurugram").
- "internship_duration": e.g. "12 months", "6 months", only if internship is mentioned.
- "ppo_package": post-internship full-time CTC if mentioned (e.g. "12.7 LPA"), even if different from "ctc".
- "salary_breakdown": array of strings, one per compensation component with its exact amount, e.g. ["Fixed: 8,80,000", "FY Bonus: 70,400", "SY Bonus: 1,92,000", "Total CTC: 12,70,400"]. Capture EVERY numeric breakdown mentioned for stipend, CTC, bonuses, PB, totals, etc. — do not merge or drop any line item.
- "eligible_courses": every eligible degree/course combination exactly as written, e.g. ["B.Tech (CS/IT/ECE)", "MCA", "M.Tech (CS/IT)", "MSc (CS/IT)"].
- "assessment_details": exact description of how the assessment will be conducted (mode, location requirements, webcam/mic rules, platform, etc.) if mentioned.
- "programming_languages": every language mentioned for the assessment/role, e.g. ["Java", "Python", "JavaScript"].
- "deadline_time": exact time mentioned for the deadline if any (e.g. "11:00 PM", "09:00 AM sharp"). Keep "deadline" as just the date.
- "contact_phone": phone number(s) as a single string (comma-separated if multiple).
- "important_instructions": array capturing every standalone instruction, condition, or note that doesn't fit cleanly into another field — e.g. bond clauses, document requirements, dress code, "no active backlogs", login/ID requirements, anything explicitly stated that you have not already captured elsewhere. Use this field generously rather than dropping information.
- "summary": a 2-3 sentence factual summary covering company, role, and the single most important number (CTC or stipend) and the deadline.

Rules:
1. Return only JSON. No markdown, no code fences, no explanation.
2. Use empty string "" if a field's data is genuinely missing. Use [] for missing arrays.
3. Never hallucinate or invent values not present in the text.
4. Do not skip a fact just because it doesn't fit neatly into one field — if in doubt, put it in "important_instructions" or fold it into "summary" rather than losing it.
5. Preserve exact numbers, currency symbols, percentages, and dates as written in the source — do not round or reword them.`
        },
        { role: "user", content: text }
      ]
    }), TEXT_MODELS);

    let content = (response.choices[0].message.content || "").trim();
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(content);

  } catch (error) {
    console.error("OpenRouter Error:", error);
    return { company_name: "", role: "", ctc: "", deadline: "", summary: "Failed to extract information" };
  }
}

async function generateProfessionalMail(originalText, jobData) {
  const response = await callWithRetry((model) => ({
    temperature: 0.25,
    max_tokens: 1100,
    messages: [
      {
        role: "system",
        content: `You are an experienced university placement coordinator who writes complete, detail-accurate placement emails. Your single biggest priority is COMPLETENESS — never drop or summarize away a fact that was present in the source notification or extracted data.

CRITICAL RULE — DO NOT SKIP ANYTHING:
- You will be given the original notification text AND a structured JSON of extracted fields. Treat BOTH as source of truth.
- Before writing, mentally checklist every non-empty field in the JSON and every concrete fact in the original text (numbers, dates, names, links, conditions, instructions). Every single one of them MUST appear somewhere in your email.
- If a field exists in the JSON but you are unsure where it fits, put it under "Additional Details:" near the end rather than omitting it.
- Never paraphrase a number, date, percentage, or eligibility condition loosely — copy it exactly as given (e.g. "7.5+ CGPA", "₹12.7 LPA", "30th June, 5:00 PM").
- If the same fact appears in both the original text and JSON with slightly different wording, prefer the more detailed/specific version, but do not lose either piece of information.
- Do NOT invent or assume any detail that is not present in the source.

Content Rules:
- Human written tone, official placement cell style.
- Open with "Dear Students," followed by a one-line intro naming the company and the roles.
- Cover, in order, whichever of these are present (skip a section ONLY if there is genuinely no data for it anywhere in the source):
  1. Roles being hired for (with number of openings if mentioned)
  2. Job type / work mode (internship, full-time, hybrid, remote, etc.)
  3. Compensation — if internship: stipend amount + duration, separately from PPO/CTC after internship; if full-time: CTC and full breakdown (fixed, bonuses, joining bonus, retention bonus, stock options, totals) each as its own line
  4. Eligibility criteria — eligible courses/branches, batch year, minimum CGPA, backlog conditions, any other listed criteria
  5. Required skills (if listed)
  6. Selection process and assessment details — stages, mode of assessment, programming languages/tools for the test, where/how conducted
  7. Important dates — test date, interview date, joining date (if any of these exist)
  8. Work location / office address (in addition to general city/location)
  9. Registration deadline — include BOTH date and time if both are available
  10. Application/registration link
  11. Contact person, contact email, contact phone (if provided)
  12. Any other important instructions from the notification (bond details, document requirements, dress code, login requirements, anything else explicitly stated)
- If extracted data has an "important_instructions" array or any field you have not used elsewhere, add a final "Additional Details:" section listing them rather than dropping them.
- Do NOT sound AI generated.

Formatting Rules (very important):
- Output PLAIN TEXT only. No Markdown, no asterisks, no hashes, no backticks.
- Start directly with "Dear Students," — no preamble like "Subject:" or "Here is the email:".
- For section titles, write them as plain text on their own line followed by a colon, e.g. "Eligibility Criteria:"
- For lists, EVERY item must be on its own separate line, starting with "- ". Never combine multiple "- " items on one line.
- Leave exactly one blank line between sections/paragraphs for readability.
- Do NOT use "---" or any horizontal rule.

Signature Rules:
- Do NOT include any sign-off, signature, name, designation, email, or phone number of the sender at the end.
- Do NOT write "Regards", "Warm regards", "Sincerely", or any closing note.
- End the email right after the last informational line (e.g. after contact details or "For any queries, contact the placement cell."). The signature block is added separately by the system.

Before finalizing, silently re-check: did I use every relevant field from the JSON and every concrete fact from the original text? If something is left over, add it to "Additional Details:" instead of dropping it.`
      },
      {
        role: "user",
        content: `Original Notification (verbatim source — treat every fact here as mandatory to include):\n\n${originalText}\n\nExtracted Data (structured — treat every non-empty field here as mandatory to include):\n\n${JSON.stringify(jobData, null, 2)}`
      }
    ]
  }), TEXT_MODELS);

  return response.choices[0].message.content;
}

async function generateCustomMail(userInstruction) {
  const response = await callWithRetry((model) => ({
    temperature: 0.35,
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content: `You are an assistant that writes professional emails on behalf of the user, based on their free-form instruction.

CRITICAL RULE — DO NOT SKIP ANYTHING:
- Treat every concrete detail in the user's instruction (names, dates, times, venues, links, numbers, conditions) as mandatory to include in the email. Re-read the instruction before finalizing and confirm every fact made it in.
- Never paraphrase a date, time, or number loosely — keep it exact as the user wrote it.
- Do NOT invent or assume any detail the user did not provide.

Content Rules:
- Understand the user's intent and write the email content they are asking for, in their voice/context (e.g. classmates, faculty, a group, an external recipient).
- Use a polite, clear, professional tone appropriate to the audience implied by the instruction.
- If the instruction itself IS the message (e.g. "tell everyone the meeting is postponed to 5pm"), turn it into a complete, well-written email body conveying exactly that, with nothing lost.
- If the instruction lists multiple pieces of information (date, time, venue, agenda, links, etc.), present each clearly — use short paragraphs or a "- " list for multiple discrete items, do not bury details inside a single dense paragraph.
- Keep it concise but complete — every fact the user gave you must appear somewhere in the output.
- Do NOT sound AI generated.

Formatting Rules (very important):
- Output PLAIN TEXT only. No Markdown, no asterisks, no hashes, no backticks.
- Do NOT add any preamble or label like "Email Body:", "Subject:", "Here is the email:". Output ONLY the email content, starting directly with a greeting if appropriate.
- For section titles (if any), write them as plain text on their own line followed by a colon.
- For lists, every item on its own separate line, starting with "- ". Never combine multiple "- " items on one line.
- Leave exactly one blank line between sections/paragraphs.
- Do NOT use "---" or any horizontal rule.

Signature Rules:
- Do NOT include any sign-off, signature, name, designation, email, or phone number at the end.
- Do NOT write "Regards", "Warm regards", "Sincerely", or any closing note, unless the user explicitly asked for a specific signature in their instruction.
- End the email right after the last informational line. A signature block is added separately by the system unless the user specified otherwise.`
      },
      { role: "user", content: userInstruction }
    ]
  }), TEXT_MODELS);

  return response.choices[0].message.content;
}

async function extractTextFromImage(base64Image, mimeType) {
  try {
    const response = await callWithRetry((model) => ({
      temperature: 0,
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This image contains a placement/job/internship notification.
Transcribe ALL visible text: company name, role, CTC/stipend, location, eligibility, dates, deadlines, links.
Return as plain readable text (not JSON). No commentary or markdown.`
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            }
          ]
        }
      ]
    }), VISION_MODELS);

    const content = response.choices[0].message.content;
    return content ? content.trim() : "";

  } catch (error) {
    console.error("OpenRouter Vision Error:", error);
    return "";
  }
}

async function generateWhatsappMessage(originalText, jobData) {
  const response = await callWithRetry((model) => ({
    temperature: 0.4,
    max_tokens: 400,
    messages: [
      {
        role: "system",
        content: `You are a university placement coordinator writing a WhatsApp broadcast for students.
- SHORT scannable message (8-15 lines)
- Use emojis: 📢 🏢 💼 💰 📍 📅 🔗
- Include: company, role, CTC/stipend, batch/branches, deadline, link
- End with call-to-action
- PLAIN TEXT only. No Markdown. No preamble. No signature.`
      },
      {
        role: "user",
        content: `Original Notification:\n\n${originalText}\n\nExtracted Data:\n\n${JSON.stringify(jobData, null, 2)}`
      }
    ]
  }), TEXT_MODELS);

  return response.choices[0].message.content;
}

module.exports = {
  extractJobDetails,
  generateProfessionalMail,
  extractTextFromImage,
  generateCustomMail,
  generateWhatsappMessage
};