#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import open from "open";
import getPort from "get-port";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "@mdr/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get package.json for version
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

program
  .name("mdr")
  .description("Beautiful markdown reader in your browser")
  .version(packageJson.version)
  .argument("[path]", "Path to markdown file or folder", ".")
  .option("-p, --port <number>", "Port to run on (default: auto-detect)")
  .option("--no-open", "Don't open browser automatically")
  .action(async (inputPath: string, options: { port?: string; open: boolean }) => {
    try {
      // Resolve the path
      const resolvedPath = path.resolve(inputPath);

      // Check if path exists
      if (!fs.existsSync(resolvedPath)) {
        console.error(chalk.red(`Error: Path does not exist: ${resolvedPath}`));
        process.exit(1);
      }

      // Determine folder path
      let folderPath: string;
      let initialFile: string | undefined;

      const stat = fs.statSync(resolvedPath);
      if (stat.isDirectory()) {
        folderPath = resolvedPath;
      } else if (stat.isFile()) {
        // If it's a file, use the parent directory as folder
        folderPath = path.dirname(resolvedPath);
        initialFile = path.basename(resolvedPath);
      } else {
        console.error(chalk.red(`Error: Invalid path: ${resolvedPath}`));
        process.exit(1);
      }

      // Get port
      const port = options.port
        ? parseInt(options.port, 10)
        : await getPort({ port: [3000, 3001, 3002, 3003, 3004, 3005] });

      // Find the client build directory
      const clientPath = path.join(__dirname, "..", "..", "client", "dist");

      if (!fs.existsSync(clientPath)) {
        console.error(chalk.red("Error: Client build not found."));
        console.error(chalk.yellow("Please run 'npm run build' in the project root first."));
        process.exit(1);
      }

      // Start server
      console.log(chalk.blue("Starting mdr..."));
      console.log(chalk.gray(`Serving markdown from: ${folderPath}`));

      const server = await createServer({
        port,
        folderPath,
        clientPath,
      });

      // Build URL
      let url = `http://localhost:${server.port}`;
      if (initialFile) {
        url += `/?file=${encodeURIComponent(initialFile)}`;
      }

      console.log(chalk.green(`\n  mdr is running at ${chalk.bold(url)}\n`));

      // Open browser
      if (options.open) {
        await open(url);
      }

      console.log(chalk.gray("Press Ctrl+C to stop\n"));

      // Handle graceful shutdown
      process.on("SIGINT", () => {
        console.log(chalk.yellow("\nShutting down..."));
        server.close(() => {
          process.exit(0);
        });
      });

      process.on("SIGTERM", () => {
        server.close(() => {
          process.exit(0);
        });
      });
    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
