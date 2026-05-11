import { prisma } from "./src/lib/prisma";

async function check() {
  const count = await prisma.investment.count();
  console.log("Total investments:", count);
  const investments = await prisma.investment.findMany({ take: 5 });
  console.log("Sample investments:", JSON.stringify(investments, null, 2));
}

check().catch(console.error);
