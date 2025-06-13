import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createPost} from "./mcp.tool.js"
import { z } from "zod";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
});

const app = express();

server.tool(
  "addTwoNumbers",
  "Add two numbers",
  {
    a: z.number(),
    b: z.number(),
  },
  async (arg) => {
    const { a, b } = arg;
    return {
      content: [
        {
          type: "text",
          text: `The sum of ${a} + ${b} is ${a + b}`,
        },
      ],
    };
  }
);

server.tool(
  "createPost",
  "Create a post on X formally known as twitter ",
  {
    status: z.string()
  },
  async (arg) => {
    const { status } = arg;
    // console.log("status: ",status)
    return createPost(status)
  }
);



server.tool(
  "subTwoNumbers",
  "subtract two numbers",
  {
    a: z.number(),
    b: z.number(),
  },
  async (arg) => {
    const { a, b } = arg;
    return {
      content: [
        {
          type: "text",
          text: `The difference of ${a} and ${b} is ${a - b}`,
        },
      ],
    };
  }
);

const transports = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

app.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
