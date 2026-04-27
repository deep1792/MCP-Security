import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const ALLOWED_ACTIONS = {
  whoami: () => {
    return new Promise((resolve) => {
      execFile("whoami", (error, stdout, stderr) => {
        resolve({ stdout, stderr });
      });
    });
  },
  list_directory: async (params) => {
    const baseDir = "/app/data";
    let targetPath = path.resolve(baseDir, params.path || "");
    if (!targetPath.startsWith(baseDir)) {
      throw new Error("Access denied: path outside safe directory");
    }
    try {
      const files = await fs.readdir(targetPath);
      return { stdout: files.join("\n"), stderr: "" };
    } catch (err) {
      return { stdout: "", stderr: err.message };
    }
  },
  read_file: async (params) => {
    const baseDir = "/app/data";
    let filePath = path.resolve(baseDir, params.filename || "");
    if (!filePath.startsWith(baseDir) || !filePath.endsWith(".txt")) {
      throw new Error("Access denied: only .txt files in /app/data are allowed");
    }
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return { stdout: content, stderr: "" };
    } catch (err) {
      return { stdout: "", stderr: err.message };
    }
  },
};

const server = new Server(
  { name: "secure-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "whoami",
      description: "Returns the current system user (safe)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_directory",
      description: "List files in /app/data",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Subpath inside /app/data" },
        },
      },
    },
    {
      name: "read_file",
      description: "Read a .txt file from /app/data",
      inputSchema: {
        type: "object",
        properties: {
          filename: { type: "string", description: "Filename (must end with .txt)" },
        },
        required: ["filename"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments || {};
  if (!ALLOWED_ACTIONS[toolName]) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  try {
    const result = await ALLOWED_ACTIONS[toolName](args);
    return {
      content: [
        {
          type: "text",
          text: `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
