import Anthropic from "@anthropic-ai/sdk";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { base64, mediaType, text } = req.body;

  const prompt = `Você é um analista financeiro especialista em faturas de cartão de crédito brasileiro. Analise cada transação individualmente e retorne APENAS um JSON válido (sem markdown, sem texto extra).

REGRAS IMPORTANTES DE CATEGORIZAÇÃO:
- "Delivery": APENAS apps de entrega de comida em casa (iFood, Rappi, Uber Eats, James, Ifood). NÃO inclua Uber de transporte.
- "Transporte": Uber (corridas), 99, táxi, ônibus, metrô, combustível, estacionamento. Uber é transporte, NÃO delivery.
- "Viagens": ClickBus, passagens de ônibus/avião, hotéis, pousadas, Booking, Airbnb.
- "Alimentação": Restaurantes, cafés, padarias, bares, lanchonetes, mercados, supermercados onde se come presencialmente.
- "Lazer": Bares noturnos, shows, eventos, cinema, entretenimento, gift cards.
- "Saúde/Beleza": Farmácias, drogarias, clínicas, salões, perfumarias, cosméticos.
- "Compras": Roupas, calçados, eletrônicos, lojas físicas e online (Shopee, Amazon, Shein).
- "Assinaturas": Netflix, Spotify, Disney+, HBO, softwares, planos mensais recorrentes.
- "Outros": Lavanderia, serviços domésticos, o que não se encaixar nas anteriores.

REGRAS DE CONTAGEM:
- Conte APENAS transações com valor positivo (estornos com valor negativo NÃO contam).
- Cada linha da fatura = 1 transação (não agrupe Uber como delivery).
- Parcelas (ex: "Parcela 2/2") contam como 1 transação de compra passada.
- Pagamentos e financiamentos NÃO são gastos, ignore-os.

Retorne este JSON exato:
{
  "total": número (total real das compras, sem pagamentos/estornos),
  "month": string (ex: "Março/2026"),
  "top_waste": string (principal vazamento com valor e quantidade reais, ex: "R$ 312 em transportes — 14 corridas de Uber e 99"),
  "categories": [
    {"name": string, "amount": número, "percentage": número, "transactions": número}
  ],
  "insights": [string, string, string],
  "challenges": [
    {
      "id": string,
      "emoji": string,
      "title": string,
      "description": string,
      "points": número (entre 15 e 100),
      "savings": número (economia mensal realista em reais),
      "category": string
    }
  ]
}

Use APENAS estas categorias: Alimentação, Delivery, Transporte, Viagens, Lazer, Assinaturas, Compras, Saúde/Beleza, Outros.
Crie exatamente 5 desafios personalizados e motivadores baseados nos gastos reais encontrados.
Os desafios devem ser práticos e específicos para os padrões de gasto identificados.`;

  try {
    let messages;
    if (base64) {
      messages = [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: mediaType || "application/pdf", data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: "user",
          content: `${prompt}\n\nDados da fatura:\n${text?.substring(0, 8000)}`,
        },
      ];
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages,
    });

    const raw = response.content.map((b) => b.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha na análise. Tente novamente." });
  }
}
