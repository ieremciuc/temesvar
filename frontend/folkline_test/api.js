// src/services/api.js
import { cosineSimilarity, getEmbedding } from "./aiSearch";

const MOCK_DATA = [
  { id: 1, title: "Hora Unirii", description: "Eveniment cultural în București", country: "RO", image: "https://picsum.photos/seed/ro1/400/300" },
  { id: 2, title: "Festivalul Mărțișorului", description: "Tradiții și muzică populară", country: "RO", image: "https://picsum.photos/seed/ro2/400/300" },
  { id: 3, author: "Ana Ionescu", description: "Dans popular în Cluj", country: "RO", image: "https://picsum.photos/seed/ro3/400/300", location: "Cluj-Napoca" },
  { id: 4, title: "Carnaval Rio", description: "Cel mai mare carnaval din lume", country: "BR", video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { id: 5, author: "Luiza Mendes", description: "Samba în favela", country: "BR", image: "https://picsum.photos/seed/br1/400/300", location: "Rio de Janeiro" },
  { id: 6, title: "Sakura Festival", description: "Hanami în Tokyo", country: "JP", image: "https://picsum.photos/seed/jp1/400/300" },
  { id: 7, author: "Yumi Sato", description: "Kimono traditional", country: "JP", image: "https://picsum.photos/seed/jp2/400/300", location: "Kyoto" },
  { id: 8, title: "Oktoberfest", description: "Berea și tradițiile bavareze", country: "DE", image: "https://picsum.photos/seed/de1/400/300" },
  { id: 9, title: "Día de los Muertos", description: "Sărbătoare tradițională", country: "MX", video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
  { id: 10, author: "Kasia Nowak", description: "Pierogi și dansuri", country: "PL", image: "https://picsum.photos/seed/pl1/400/300", location: "Varșovia" },
];

let dataEmbeddings = [];

const preloadEmbeddings = async () => {
  console.log("Încarc AI embeddings...");
  dataEmbeddings = [];
  for (const item of MOCK_DATA) {
    const text = `${item.title || ""} ${item.description || ""} ${item.location || ""} ${item.author || ""} ${item.country || ""}`.trim();
    const emb = await getEmbedding(text);
    if (emb) {
      dataEmbeddings.push({ item, emb });
    }
  }
  console.log("AI Search gata! (" + dataEmbeddings.length + " embeddings)");
};

preloadEmbeddings();

export const searchEventsByKeyword = async (keyword) => {
  if (!keyword?.trim()) return [];

  const kw = keyword.trim().toLowerCase();

  // 1. @autor
  if (kw.startsWith("@")) {
    const author = kw.slice(1);
    return MOCK_DATA.filter(item =>
      item.author?.toLowerCase().includes(author)
    );
  }

  // 2. AI Search
  const queryEmb = await getEmbedding(kw);
  if (queryEmb && dataEmbeddings.length > 0) {
    console.log("AI: Căutare semantică...");
    const results = dataEmbeddings
      .map(({ item, emb }) => ({
        item,
        score: cosineSimilarity(queryEmb, emb)
      }))
      .filter(r => r.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .map(r => r.item);

    if (results.length > 0) {
      console.log("AI: Găsite", results.length, "rezultate");
      return results;
    }
  }

  // 3. FALLBACK: căutare text cu diacritice
  console.log("Fallback: căutare text...");
  const norm = (s) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
  return MOCK_DATA.filter(item => {
    const full = `${item.title} ${item.description} ${item.location} ${item.author} ${item.country}`;
    return norm(full).includes(norm(kw));
  });
};

export const getEventsByCountry = async (code) => {
  await new Promise(r => setTimeout(r, 600));
  return MOCK_DATA.filter(item => item.country === code);
};