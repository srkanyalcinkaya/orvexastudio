import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDatabase();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[api] running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("[api] failed to start", error);
  process.exit(1);
});
