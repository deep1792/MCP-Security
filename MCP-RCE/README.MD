MCP Remote Code Execution (RCE) Vulnerability Lab

> Complete demonstration of the architectural command injection flaw in Anthropic’s Model Context Protocol (MCP)  
> Includes vulnerable server, exploit client, and secure hardened server.

Overview - The Model Context Protocol (MCP) allows AI assistants (like Claude) to interact with external tools. A fundamental design flaw in many MCP implementations – accepted by Anthropic as “expected” behaviour – lets attackers execute arbitrary system commands through malicious tool calls.  
This lab reproduces the vulnerability in a safe Docker environment and provides a secure alternative.

Real‑World Impact
- Affects all official MCP SDKs (Python, TypeScript, Java, Rust)
- >150 million downloads exposed
- ~200,000 servers potentially vulnerable
- Multiple CVEs published, e.g., CVE‑2026‑30623 (LiteLLM), CVE‑2026‑33224 (Bisheng)

How MCP Works

```
┌─────────────┐      JSON‑RPC      ┌─────────────┐
│   MCP Host  │ ◄────────────────► │  MCP Server │
│  (Claude)   │   over STDIO/HTTP  │  (Tool API) │
└─────────────┘                    └─────────────┘
      │                                    │
      │ 1. List tools                      │
      ├───────────────────────────────────►│
      │ 2. Tool schemas                    │
      │◄───────────────────────────────────┤
      │ 3. Call tool with arguments        │
      ├───────────────────────────────────►│
      │ 4. Execution result                │
      │◄───────────────────────────────────┤
```

A vulnerable tool definition might accept a raw `command` string and pass it directly to the system shell.

Vulnerability: Command Injection

- Root cause: The server exposes a tool like `run_command` that takes a free‑form `command` parameter.
- Why it’s dangerous: No input validation + direct `exec()` call = Remote Code Execution.
- Attack vector: Attacker (or malicious AI prompt) calls the tool with `"command": "whoami && cat /etc/passwd"`.

 📁 Lab Structure

```
mcp-rce/
├── vulnerable/
│   ├── Dockerfile
│   ├── insecure-server.js
│   └── test-client.js
├── secure/
│   ├── Dockerfile.secure
│   ├── secure-server.js
│   ├── test-secure.js
│   └── data/hello.txt
└── README.md
```

We run everything from a single directory for simplicity.  
The secure server restricts access to a `data/` subdirectory and uses a non‑root user.

Quick Start (Vulnerable Lab)

1. Clone / Create files

Place the following files in `~/Downloads/mcp-rce/`:
- `package.json`
- `insecure-server.js`
- `test-client.js`
- `Dockerfile`

Use the code blocks provided in the sections below.

2. Build the vulnerable image
```
cd ~/Downloads/mcp-rce
docker build -t vuln-mcp-lab .
```

3. Run the exploit
```
docker run -it --rm -v $(pwd):/app vuln-mcp-lab node /app/test-client.js
```

Expected output (RCE proof):
```
=== RCE OUTPUT ===
STDOUT:
root
uid=0(root) gid=0(root) groups=0(root)
RCE achieved!
root:x:0:0:root:/root:/bin/ash
bin:x:1:1:bin:/bin:/sbin/nologin

STDERR:
```

Cleanup
```
Stop and remove containers, images, and the lab directory
docker ps -a --filter "name=mcp-lab" -q | xargs -r docker rm -f
docker ps -a --filter "ancestor=vuln-mcp-lab" -q | xargs -r docker rm -f
docker ps -a --filter "ancestor=secure-mcp-lab" -q | xargs -r docker rm -f
docker rmi -f vuln-mcp-lab secure-mcp-lab 2>/dev/null
docker system prune -f
rm -rf ~/Downloads/mcp-rce
```

Key Takeaways for Developers
1. Never trust the client – AI or user input can be malicious.
2. Design tools as capabilities, not command executors. Use a fixed set of allowed operations.
3. Always use `execFile` with a hardcoded executable path, never `exec` or `spawn` with a shell.
4. Validate everything – paths, file types, arguments.
5. Run with least privilege – use a non‑root user in containers.
6. Test both vulnerable and secure versions to understand the risk.


 ⚠️ Disclaimer

> This lab is for educational and defensive purposes only.  
> Do not use the vulnerable code or exploit on any system you do not own or have explicit permission to test. The author assumes no liability for misuse.


## Support This Project via UPI 🇮🇳

If you find **Kubepwn** useful and want to support its development, you can send a payment via UPI:

**UPI ID:** "alivejatt@oksbi"


Or scan the QR code below using any UPI app (Google Pay, PhonePe, Paytm, etc.):
![UPI QR Code](https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=alivejatt@oksbi&size=200x200)

[![Pay via UPI](https://img.shields.io/badge/Pay%20via-UPI-blue?style=for-the-badge&logo=google-pay)](upi://pay?pa=alivejatt@oksbi&pn=Kubepwn+Support&cu=INR)


