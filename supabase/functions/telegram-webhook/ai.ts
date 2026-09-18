const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") || "openrouter/free";

export type TelegramAiInput = {
  text: string;
  amount?: number | null;
  transaction_date?: string | null;
  categories: Array<{ name: string; type: string }>;
  wallets: Array<{ name: string }>;
};

export async function classifyWithOpenRouter(input: TelegramAiInput) {
  if (!OPENROUTER_API_KEY) return null;

  const prompt = `Classify this Indonesian personal-finance message. Return JSON only.
Message: ${input.text}
Known amount: ${input.amount ?? "not provided"}
Reference date (Asia/Jakarta): ${input.transaction_date ?? "not provided"}
Existing categories: ${JSON.stringify(input.categories)}
Existing wallets: ${JSON.stringify(input.wallets)}
Rules:
- Determine type only as income, expense, or unknown.
- If this is not clearly a financial transaction, use type unknown.
- Do not invent category or wallet names. category_name and wallet_name must exactly match an existing item or be null.
- Extract amount only when explicitly stated or unambiguous from the message.
- Resolve relative dates such as today, yesterday, kemarin, besok using the reference date.
- Use YYYY-MM-DD for transaction_date, or null when the date cannot be resolved.
- description should be a concise Indonesian transaction description.
- confidence must be between 0 and 1.
Return: type, amount, transaction_date, description, merchant, category_name, wallet_name, confidence, reason.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://jsuryanaads.github.io/WeMONEY/",
        "X-Title": "WeMONEY Telegram Assistant",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are WeMONEY Telegram financial transaction classifier. Be conservative. Never invent financial data, categories, or wallets.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned empty content");
    const parsed = JSON.parse(String(content));
    return {
      provider: "openrouter",
      model: OPENROUTER_MODEL,
      result: parsed,
    };
  } finally {
    clearTimeout(timeout);
  }
}
