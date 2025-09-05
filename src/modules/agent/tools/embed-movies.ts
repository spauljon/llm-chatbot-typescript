// scripts/embed-movies.ts
import 'dotenv/config';
import neo4j, { Driver } from 'neo4j-driver';
import OpenAI from 'openai';

const OPENAI_MODEL = 'text-embedding-ada-002'; // 1536 dims
const BATCH = 100; // tune to your dataset / rate limits

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function main() {
  const driver: Driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
  );

  const session = driver.session();

  try {
    // 1) Fetch movie ids + text to embed (adjust properties to your graph)
    const { records } = await session.run(
      `
      MATCH (m:Movie)
      WHERE m.tagline IS NOT NULL AND m.title IS NOT NULL
      RETURN elementId(m) AS elemId, m.movieId AS movieId, m.title AS title, m.tagline AS tagline
      `
    );

    const movies = records.map(r => ({
      elemId: r.get('elemId') as string,
      text: `${r.get('title')}\n\n${r.get('tagline')}`
    }));

    // 2) Batch through and embed
    for (let i = 0; i < movies.length; i += BATCH) {
      const batch = movies.slice(i, i + BATCH);

      const inputs = batch.map(m => m.text);

      // OpenAI embeddings call (ada-002 => 1536 dims)
      const resp = await openai.embeddings.create({
        model: OPENAI_MODEL,
        input: inputs
      });

      // 3) Write back vectors
      const tx = session.beginTransaction();
      try {
        for (let j = 0; j < batch.length; j++) {
          const embedding = resp.data[j].embedding; // number[]
          const elemId = batch[j].elemId;
          await tx.run(
            `
            MATCH (m) WHERE elementId(m) = $elemId
            SET m.embedding = $embedding
            `,
            { elemId, embedding }
          );
        }
        await tx.commit();
      } catch (e) {
        await tx.rollback();
        throw e;
      }

      console.log(`Embedded ${Math.min(i + BATCH, movies.length)} / ${movies.length}`);
      // Optional: small delay to be kind to the API
      await new Promise(r => setTimeout(r, 100));
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
