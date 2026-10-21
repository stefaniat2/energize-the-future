// Small wrapper around fetch() for talking to the Energize the Future backend.
// Which API to call:
//   1. VITE_API_URL if it was set when the app was built (use it to point at another server)
//   2. otherwise the live API in production builds, so the deployed site works even if the
//      variable was forgotten in the hosting dashboard (a build can't read it later)
//   3. otherwise the local backend during development
const PRODUCTION_API_URL = "https://energize-the-future-wuln.onrender.com/api";
const DEFAULT_API_URL = import.meta.env.PROD ? PRODUCTION_API_URL : "http://localhost:5001/api";

// Trailing slash stripped so "https://host/api/" and "https://host/api" behave the same.
const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    throw new Error("Could not reach the server. Please check your connection and try again.");
  }

  let body;
  try {
    body = await response.json();
  } catch (err) {
    throw new Error("The server returned an unexpected response.");
  }

  if (!response.ok || body.success === false) {
    const message = body.message || "Something went wrong.";
    const error = new Error(message);
    error.errors = body.errors;
    throw error;
  }

  return body.data;
}

export const api = {
  getFacts: (lang) => request(`/facts?lang=${lang}`),
  getFactsByCategory: (category, lang) => request(`/facts/category/${category}?lang=${lang}`),
  getRandomFact: (lang, category) =>
    request(`/facts/random?lang=${lang}${category ? `&category=${category}` : ""}`),

  getGameScenarios: (lang) => request(`/game/scenarios?lang=${lang}`),
  submitScore: (payload) => request("/game/scores", { method: "POST", body: JSON.stringify(payload) }),
  getLeaderboard: (limit = 10) => request(`/game/leaderboard?limit=${limit}`),

  submitSuggestion: (payload) => request("/suggestions", { method: "POST", body: JSON.stringify(payload) }),

  submitContactMessage: (payload) => request("/contact", { method: "POST", body: JSON.stringify(payload) }),
};
