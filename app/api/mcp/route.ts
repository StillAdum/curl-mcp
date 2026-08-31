import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const mcpHandler = createMcpHandler(() => {
  const server = new McpServer({
    name: "curl-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "curl",
    {
      title: "cURL",
      description:
        "Make an HTTP request with a URL, method, headers, query parameters, and body.",
      inputSchema: z.object({
        url: z.string().url(),
        method: z
          .enum([
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "HEAD",
            "OPTIONS",
          ])
          .default("GET"),
        headers: z
          .record(z.string(), z.string())
          .optional()
          .default({}),
        body: z.string().optional(),
        timeout: z.number().int().min(100).max(120000).default(30000),
      }),
    },
    async ({ url, method, headers, body, timeout }) => {
      const controller = new AbortController();

      const timer = setTimeout(() => {
        controller.abort();
      }, timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body:
            method === "GET" ||
            method === "HEAD" ||
            method === "OPTIONS"
              ? undefined
              : body,
          signal: controller.signal,
          redirect: "follow",
        });

        const responseHeaders: Record<string, string> = {};

        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const responseBody = await response.text();

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  status: response.status,
                  statusText: response.statusText,
                  headers: responseHeaders,
                  body: responseBody,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error:
                  error instanceof Error
                    ? error.message
                    : String(error),
              }),
            },
          ],
        };
      } finally {
        clearTimeout(timer);
      }
    },
  );

  return server;
});

export async function GET(request: Request) {
  return mcpHandler.fetch(request);
}

export async function POST(request: Request) {
  return mcpHandler.fetch(request);
}

export async function DELETE(request: Request) {
  return mcpHandler.fetch(request);
}
