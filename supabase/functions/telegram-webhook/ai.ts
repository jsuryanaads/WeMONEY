const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") || "openrouter/free";

export type TelegramAiInput = {
  text: string;
  amount: number;
  transaction_date: string;
  categories: Array<{ name: string; type: string }>;
  wallets: Array<{ name: string }>;
};

export async function classifyWithOpenRouter(input: TelegramAiInput) {
  if (!OPENROUTER_API_KEY) return null;

  const prompt = `Classify this Indonesian personal-finance transaction. Return JSON only.
Transaction: ${input.text}
Explicit amount: ${input.amount}
Explicit date: ${input.transaction_date}
Existing categories: ${JSON.stringify(input.categories)}
Existing wallets: ${JSON.stringify(input.wallets)}
Never invent a category or wallet. Preserve the explicit amount and date.
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
            content: "You are WeMONEY Telegram financial transaction classifier. Be conservative and never invent category or wallet names.",
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
