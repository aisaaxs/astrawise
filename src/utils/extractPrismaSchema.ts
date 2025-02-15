import fs from "fs";
import path from "path";

export function extractPrismaSchema(): string {
    const schemaPath = path.resolve("prisma/schema.prisma");
    try {
      const schema = fs.readFileSync(schemaPath, "utf-8");
      const models = schema.match(/model\s+\w+\s+\{[^}]+\}/g) || [];
      return models.join("\n\n");
    } catch (error) {
      console.error("Error reading Prisma schema file:", error);
      return '';
    }
  }