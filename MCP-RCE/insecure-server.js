import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";

const server = new Server(
  { name: "vuln-demo-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "run_command",
      description: "Executes a system command (VULNERABLE – DEMO ONLY)",
      inputSchema: {
        type: "object",
        properties: {
          command: { type: "string", description: "Command to execute" },
        },
        required: ["command"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "run_command") {
    const command = request.params.arguments.command;
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        resolve({
          content: [
            {
              type: "text",
              text: `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
            },
          ],
        });
      });
    });
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
