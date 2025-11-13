// src/services/aiSearch.js
const HF_API_KEY = "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"; // Token-ul tău

// MODELUL CORECT + ROUTER NOU (2025)
const MODEL_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2";

let embeddingsCache = {};

export const getEmbedding = async (text) => {
  if (!text?.trim()) return null;
  const cleanText = text.trim();

  if (embeddingsCache[cleanText]) {
    console.log("AI: Cache hit:", cleanText);
    return embeddingsCache[cleanText];
  }

  try {
    console.log("AI: Cer embedding pentru:", cleanText);
    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: cleanText }), // SINGLE TEXT
    });

    if (!response.ok) {
      const err = await response.text();
      console.warn("HF API error:", err);
      return null;
    }

    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("AI: Răspuns invalid:", data);
      return null;
    }

    const embedding = data[0];
    embeddingsCache[cleanText] = embedding;
    console.log("AI: Embedding OK (lungime:", embedding.length + ")");
    return embedding;
  } catch (e) {
    console.warn("AI offline:", e.message);
    return null;
  }
};

export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return isNaN(sim) ? 0 : sim;
};