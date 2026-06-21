import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CategorizePayload {
  notes: string;
}

const VALID_CATEGORIES = [
  "Healthcare",
  "Finance",
  "Retail",
  "Technology",
  "Education",
  "Manufacturing",
  "Real Estate",
  "Automotive",
  "Media",
  "Other",
];

const SYSTEM_PROMPT = `You are a data-operations assistant that categorizes consumer panel participants into industry segments.

Given a short unstructured note about a participant, respond with ONLY the most appropriate category from this exact list:
${VALID_CATEGORIES.join(", ")}

Rules:
- Respond with exactly one category name.
- If the note is empty or ambiguous, respond with "Other".
- Do not add explanations, quotes, or punctuation.
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { notes } = (await req.json()) as CategorizePayload;
    const trimmed = (notes || "").trim();

    if (!trimmed) {
      return new Response(
        JSON.stringify({ category: "Other" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // OpenAI API call using environment key
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      // Fallback: simple keyword matching if no API key is configured
      const lower = trimmed.toLowerCase();
      const keywordMap: Record<string, string> = {
        health: "Healthcare",
        hospital: "Healthcare",
        doctor: "Healthcare",
        medical: "Healthcare",
        pharma: "Healthcare",
        bank: "Finance",
        finance: "Finance",
        insurance: "Finance",
        invest: "Finance",
        stock: "Finance",
        retail: "Retail",
        shop: "Retail",
        store: "Retail",
        ecommerce: "Retail",
        tech: "Technology",
        software: "Technology",
        engineer: "Technology",
        it: "Technology",
        education: "Education",
        school: "Education",
        student: "Education",
        teacher: "Education",
        manufacturing: "Manufacturing",
        factory: "Manufacturing",
        "real estate": "Real Estate",
        property: "Real Estate",
        automotive: "Automotive",
        car: "Automotive",
        vehicle: "Automotive",
        media: "Media",
        news: "Media",
        journalist: "Media",
      };

      let matched = "Other";
      for (const [kw, cat] of Object.entries(keywordMap)) {
        if (lower.includes(kw)) {
          matched = cat;
          break;
        }
      }

      return new Response(
        JSON.stringify({ category: matched }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: trimmed },
        ],
        temperature: 0.2,
        max_tokens: 10,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${err}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openaiData = await openaiRes.json();
    const raw = openaiData?.choices?.[0]?.message?.content?.trim() || "Other";
    const normalized = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === raw.toLowerCase(),
    ) || "Other";

    return new Response(
      JSON.stringify({ category: normalized }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
