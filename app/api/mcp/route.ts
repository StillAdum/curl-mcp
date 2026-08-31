import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const handler = createMcpHandler(() => {
  const server = new McpServer(
    {
      name: "curl-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.registerTool(
    "curl",
    {
      title: "cURL HTTP Request",
      description:
        "Make an HTTP request to a URL with a method, headers, query parameters and body.",
      inputSchema: {
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
          .describe("HTTP headers such as Authorization, X-API-Key, etc."),

        body: z
          .string()
          .optional()
          .describe("Raw request body"),

        timeout: z
          .number()
          .int()
          .min(100)
          .max(120000)
          .default(30000),
      },
    },
    async ({ url, method, headers, body, timeout }) => {
      const controller = new AbortController();

      const timer = setTimeout(() => {
        controller.abort();
      }, timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: headers ?? {},
          body:
            method === "GET" || method === "HEAD" || method === "OPTIONS"
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
              type: "text",
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
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error
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

export { handler as GET, handler as POST, handler as DELETE };