import { prisma } from "./prisma";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const connectPostgres = async (): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {

      await prisma.$queryRaw`SELECT 1`;
      console.log(`✅ Postgres connected (attempt ${attempt})`);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Postgres connect failed (${attempt}/${MAX_RETRIES}): ${msg}`);

      if (attempt === MAX_RETRIES) {
        console.error("Postgres unreachable after all retries. Exiting.");
        throw err;
      }

      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
};