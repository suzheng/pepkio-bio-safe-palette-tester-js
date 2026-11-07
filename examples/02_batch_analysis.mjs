// SPDX-License-Identifier: MIT
import { PepkioClient } from "../dist/index.js";

async function main() {
  const apiKey = process.env.PEPKIO_API_KEY || "your-api-key";
  const client = new PepkioClient({ apiKey });

  const manifest = await client.getManifest();
  const examples = client.listExamples(manifest);
  console.log(`Found ${examples.length} test configurations for batch execution:`);

  const batchResults = [];
  for (const item of examples.slice(0, 3)) {
    console.log(`-> Processing batch item: ${item.name}`);
    try {
      const input = await client.getExampleInput(item.name);
      const res = await client.run(input, { label: `batch_${item.name}` });
      batchResults.push({
        example: item.name,
        status: res.status,
        runId: res.run_id,
        permalink: res.permalink,
      });
    } catch (err) {
      console.error(`   Failed to run ${item.name}:`, err.message);
    }
  }

  console.log("\nBatch execution summary:");
  for (const item of batchResults) {
    console.log(` - [${item.status}] ${item.example}: runId=${item.runId} permalink=${item.permalink}`);
  }
}

main().catch(console.error);
