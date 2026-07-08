// Groq (OpenAI-compatible) chat completions. Replaces Base44 InvokeLLM.
// Returns a parsed JSON object matching the caller's response_json_schema.

const BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export async function invokeLLM({ prompt, system, response_json_schema, temperature }) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured on the server');
    }
    if (!prompt) throw new Error('prompt is required');

    const wantsJson = !!response_json_schema;

    const messages = [];
    const systemParts = [];
    if (system) systemParts.push(system);
    if (wantsJson) {
        systemParts.push(
            'Respond with ONLY a single valid JSON object and no markdown, commentary, or code ' +
            'fences. The JSON MUST conform exactly to this JSON schema:\n' +
            JSON.stringify(response_json_schema)
        );
    }
    if (systemParts.length) {
        messages.push({ role: 'system', content: systemParts.join('\n\n') });
    }
    messages.push({ role: 'user', content: prompt });

    const body = {
        model: MODEL,
        messages,
        // Low default; grading callers pass 0 for determinism/consistency.
        temperature: typeof temperature === 'number' ? temperature : 0.4,
    };
    if (wantsJson) body.response_format = { type: 'json_object' };

    const resp = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const detail = await resp.text().catch(() => '');
        throw new Error(`Groq API error ${resp.status}: ${detail.slice(0, 500)}`);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? '';

    if (!wantsJson) return content;

    // Parse JSON, tolerating an accidental code fence or surrounding prose.
    try {
        return JSON.parse(content);
    } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
            try { return JSON.parse(match[0]); } catch { /* fall through */ }
        }
        throw new Error('LLM did not return valid JSON');
    }
}
