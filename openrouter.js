const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Confirmed free models June 2026
const TEXT_MODELS = [
  "openrouter/free",
  "meta-llama/llama-4-scout:free",
  "qwen/qwen3-8b:free",
  "mistralai/mistral-small-3.2-24b-instruct:free",
];

const VISION_MODELS = [
  "meta-llama/llama-4-scout:free",
  "meta-llama/llama-4-maverick:free",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callWithRetry(buildMessages, modelList, maxAttempts = 6) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = modelList[attempt % modelList.length];
    try {
      const { messages, max_tokens, temperature } = buildMessages(model);
      const response = await client.chat.completions.create({
        model,
        temperature: temperature ?? 0,
        max_tokens: max_tokens ?? 800,
        messages,
      });
      return response;
    } catch (err) {
      const status = err.status || err.code;
      // Skip unavailable/paid models immediately, try next
      if (status === 404) {
        console.log(`Model ${model} not available free, trying next...`);
        continue;
      }
      if (status === 429 || status === 503) {
        const wait = Math.min((err.error?.metadata?.retry_after_seconds || 5) * 1000, 10000);
        console.log(`Rate limited on ${model}, waiting ${Math.ceil(wait/1000)}s...`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All models exhausted, try again later.");
}

async function extractJobDetails(text) {
  try {
    const response = await callWithRetry((model) => ({
      temperature: 0,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: `You are an expert placement and recruitment analyst.
Extract information from the given job notification.
Return ONLY valid JSON with this schema:
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
Rules: Return only JSON. No markdown. No explanation. Empty string if missing. [] for missing arrays. Never hallucinate.`
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
    temperature: 0.3,
    max_tokens: 900,
    messages: [
      {
        role: "system",
        content: `You are an experienced university placement coordinator.
Write a professional placement email body.

Content Rules:
- Human written tone, official placement cell style
- Include all important details
- If internship: include duration, stipend, PPO package separately
- Include salary breakdown if available (each component on own line)
- Include eligibility criteria, selection process, assessment details
- Include deadline with date and time, application link
- Do NOT sound AI generated

Formatting Rules:
- PLAIN TEXT only. No Markdown, no asterisks, no hashes.
- Start with "Dear Students,"
- Section titles: plain text + colon on own line
- Lists: each item on own line starting with "- "
- Blank line between sections

Signature Rules:
- NO sign-off, signature, name, designation, or closing.
- End after last informational line.`
      },
      {
        role: "user",
        content: `Original Notification:\n\n${originalText}\n\nExtracted Data:\n\n${JSON.stringify(jobData, null, 2)}`
      }
    ]
  }), TEXT_MODELS);

  return response.choices[0].message.content;
}

async function generateCustomMail(userInstruction) {
  const response = await callWithRetry((model) => ({
    temperature: 0.4,
    max_tokens: 900,
    messages: [
      {
        role: "system",
        content: `You are an assistant that writes professional emails on behalf of the user.
- Understand intent, write the email content asked for
- Polite, clear, professional tone
- Include all details user mentioned, do not invent
- PLAIN TEXT only. No Markdown.
- Start with greeting if appropriate
- Lists: each item on own line starting with "- "
- NO sign-off, signature, or closing.`
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