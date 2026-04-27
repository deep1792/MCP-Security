import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["secure-server.js"],
});

const client = new Client(
  { name: "secure-client", version: "1.0.0" },
  { capabilities: {} }
);

await client.connect(transport);

// Attempt malicious injection
try {
  const result = await client.callTool({
    name: "run_command",
    arguments: { command: "whoami && id" },
  });
  console.log("Injection result:", result.content[0].text);
} catch (err) {
  console.log("[!] Injection blocked:", err.message);
}

// Allowed tools
const whoami = await client.callTool({ name: "whoami", arguments: {} });
console.log("whoami output:", whoami.content[0].text);

const ls = await client.callTool({ name: "list_directory", arguments: { path: "" } });
console.log("Directory listing:", ls.content[0].text);

if (ls.content[0].text.includes("hello.txt")) {
  const read = await client.callTool({ name: "read_file", arguments: { filename: "hello.txt" } });
  console.log("Content of hello.txt:", read.content[0].text);
}

await client.close();
