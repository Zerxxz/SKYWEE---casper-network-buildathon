#!/usr/bin/env python3
"""
cspr-auth-proxy.py — Local HTTP forward proxy for CSPR.cloud RPC.

WHY THIS EXISTS
===============
As of mid-2026, Casper Association retired the legacy
`rpc.testnet.casper.network` and `events.testnet.casper.network` endpoints
(both now NXDOMAIN). The canonical RPC proxy is now CSPR.cloud, which
requires `Authorization: Bearer <token>` on every request.

`casper-client` CLI (the official Casper CLI tool, v5+) does NOT support
custom HTTP headers — there's no `--header` or `--auth-token` flag. This
makes it impossible to use casper-client directly against CSPR.cloud.

This script is a tiny localhost HTTP forward proxy that:
  1. Listens on 127.0.0.1:7778
  2. Receives incoming HTTP requests (from casper-client)
  3. Adds `Authorization: Bearer <token>` header
  4. Forwards to https://node.testnet.cspr.cloud (or whatever CSPR_CLOUD_TARGET is set to)
  5. Streams the response back to casper-client

The Odra livenet-env path (`cargo run --bin deploy_skywee --features livenet`)
does NOT need this proxy — it natively reads CSPR_CLOUD_AUTH_TOKEN env var
and adds the header itself (see odra-casper/rpc-client/src/casper_client.rs).
This proxy is ONLY needed for the casper-client CLI path.

USAGE
=====
Terminal 1 (start the proxy):
    export CSPR_PROXY_TOKEN="your_cspr_cloud_bearer_token"
    python3 scripts/cspr-auth-proxy.py
    # → listens on http://127.0.0.1:7778

Terminal 2 (run casper-client through the proxy):
    casper-client put-deploy \\
        --node-address http://127.0.0.1:7778/rpc \\
        --chain-name casper-test \\
        --secret-key ~/.casper/testnet/secret_key.pem \\
        --session-path contracts/odra/wasm/AgentRegistry.wasm \\
        --payment-amount 10000000000 \\
        --ttl 30min

Or use scripts/deploy-casper-client.sh which handles all of this
automatically (it detects cspr.cloud URLs and routes through 127.0.0.1:7778).

ENVIRONMENT VARIABLES
=====================
CSPR_PROXY_TOKEN    (required) Bearer token for CSPR.cloud
CSPR_PROXY_TARGET   (optional) Target host. Default: https://node.testnet.cspr.cloud
CSPR_PROXY_PORT     (optional) Local listen port. Default: 7778

GET A TOKEN
===========
1. Go to https://cspr.cloud
2. Sign in (or create an account)
3. Go to Account → API Tokens
4. Create a token with read+write permissions
"""

from __future__ import annotations

import http.server
import os
import sys
import urllib.parse
import urllib.request

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
TOKEN = os.environ.get("CSPR_PROXY_TOKEN") or os.environ.get("CSPR_CLOUD_AUTH_TOKEN") or ""
TARGET = os.environ.get("CSPR_PROXY_TARGET", "https://node.testnet.cspr.cloud")
PORT = int(os.environ.get("CSPR_PROXY_PORT", "7778"))

# Hosts allowed for forwarding. The proxy refuses to forward to anything else
# (prevents SSRF-style misuse).
ALLOWED_TARGETS = {
    "node.testnet.cspr.cloud",
    "node-sse.testnet.cspr.cloud",
    "node.cspr.cloud",
    "node-sse.cspr.cloud",
}

# Headers we strip from the client request before forwarding (HTTP hop-by-hop
# headers + the Authorization we're going to set ourselves).
STRIP_REQUEST_HEADERS = {
    "host", "authorization", "proxy-authorization",
    "connection", "keep-alive", "proxy-authenticate",
    "proxy-connection", "te", "trailer", "transfer-encoding", "upgrade",
}

# Headers we strip from the upstream response before sending back to client.
STRIP_RESPONSE_HEADERS = {
    "connection", "keep-alive", "proxy-authenticate",
    "proxy-connection", "te", "trailer", "transfer-encoding", "upgrade",
    "content-encoding",  # we read the decoded body
    "content-length",    # we'll recompute
}


# ---------------------------------------------------------------------------
# Validate environment
# ---------------------------------------------------------------------------
if not TOKEN:
    print(
        "ERROR: CSPR_PROXY_TOKEN (or CSPR_CLOUD_AUTH_TOKEN) env var is not set.\n"
        "Get a token at https://cspr.cloud (Account → API Tokens).",
        file=sys.stderr,
    )
    sys.exit(1)

target_host = urllib.parse.urlparse(TARGET).hostname or ""
if target_host not in ALLOWED_TARGETS:
    print(
        f"ERROR: CSPR_PROXY_TARGET host '{target_host}' is not in allowed list.\n"
        f"Allowed: {sorted(ALLOWED_TARGETS)}",
        file=sys.stderr,
    )
    sys.exit(1)

print(f"cspr-auth-proxy starting up", file=sys.stderr)
print(f"  Listen:    http://127.0.0.1:{PORT}", file=sys.stderr)
print(f"  Target:    {TARGET}", file=sys.stderr)
print(f"  Token:     {'*' * (len(TOKEN) - 4) + TOKEN[-4:] if len(TOKEN) > 4 else '(short)'}", file=sys.stderr)
print(f"  Endpoint:  http://127.0.0.1:{PORT}/rpc  (use this as --node-address for casper-client)", file=sys.stderr)
print(f"", file=sys.stderr)
print(f"  Ready. Press Ctrl+C to stop.", file=sys.stderr)


# ---------------------------------------------------------------------------
# HTTP handler
# ---------------------------------------------------------------------------
class ProxyHandler(http.server.BaseHTTPRequestHandler):
    """Forward requests to CSPR.cloud with Bearer auth injected."""

    # Quiet down logging (don't dump every request to stderr — too noisy)
    def log_message(self, fmt, *args):
        # Only log errors; normal requests handled silently
        if args and "error" in str(args[0]).lower():
            super().log_message(fmt, *args)

    def do_GET(self):
        self._forward("GET")

    def do_POST(self):
        self._forward("POST")

    def do_OPTIONS(self):
        self._forward("OPTIONS")

    def _forward(self, method: str):
        # Read request body if any
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        # Build target URL: TARGET + path
        # Self.path is like "/rpc" or "/events/main"
        target_url = TARGET.rstrip("/") + self.path

        # Build headers for upstream. Copy client headers (except stripped ones).
        upstream_headers = {}
        for k, v in self.headers.items():
            if k.lower() in STRIP_REQUEST_HEADERS:
                continue
            upstream_headers[k] = v

        # Inject Bearer token
        upstream_headers["Authorization"] = f"Bearer {TOKEN}"
        upstream_headers["Host"] = target_host

        # Make upstream request
        try:
            req = urllib.request.Request(
                target_url,
                data=body,
                method=method,
                headers=upstream_headers,
            )
            with urllib.request.urlopen(req, timeout=300) as resp:
                status = resp.status
                resp_headers = resp.headers
                resp_body = resp.read()
        except urllib.error.HTTPError as e:
            status = e.code
            resp_headers = e.headers
            resp_body = e.read() if e.fp else b""
        except urllib.error.URLError as e:
            self.send_response(502)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(f"proxy: upstream connection failed: {e}\n".encode())
            return
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(f"proxy: internal error: {e}\n".encode())
            return

        # Send response back to client
        self.send_response(status)
        for k, v in resp_headers.items():
            if k.lower() in STRIP_RESPONSE_HEADERS:
                continue
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(resp_body)))
        self.end_headers()
        if method != "HEAD":
            self.wfile.write(resp_body)


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
class QuietHTTPServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    try:
        server = QuietHTTPServer(("127.0.0.1", PORT), ProxyHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.", file=sys.stderr)
        server.shutdown()
        sys.exit(0)
