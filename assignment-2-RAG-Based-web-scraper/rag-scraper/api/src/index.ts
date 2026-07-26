import { createApp } from "./app.js";

console.log("API DATABASE_URL:", process.env.DATABASE_URL);

const PORT = process.env.API_PORT ?? 4000;

createApp().listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});