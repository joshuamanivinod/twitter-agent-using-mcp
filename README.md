Created an AI agent to do twitter post on my behalf using mcp server

## client
1. import readline/promises
2. use readline to create interface for i/o
3. create chatloop to ask question(promise)
4. push user,part:(text,type) question to history
5. create response using await
6. using @modelcontextprotocol/sdk import McpServer,SSEServerTransport
7. create mcpClient
8. declare tools=[] globally
9.  connect mcpClient to backend("/sse") using SSEClientTransport
10. like this we get access to all the resourses prompts and tools of backend
11. map each tool with the help of console.log("Available tools: ", tools);
12. list the tools in chatloop
13. to tell AI hamare paas itne tools hai, aur tum uska use kar sakte ho, we add config while taking reponse using generateContent
```
    config:{
      tools:[
        {
          functionDeclarations: tools
        }
      ]
    }
```
14.  shift calling chatloop() outside to inside mcpClient  
15.  whenever ai does a function call we get to see when console.log(response.candidates[0].content) or console.log(response.candidates[0].content.parts[0])
16. we need to allow ai to do the function call, how? by doing const functionCall=response.candidates[0].content.parts[0].functionCall and if a functionCall exists then call chatloop(functionCall) and in chatloop(toolCall) and then do mcpClient.callTool
17. push both Calling tool and toolResult to chatHistory
18. run node index.js


## server
1. boiler plate (run npx nodemon index.js)
```
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
});

const app = express();

const transports = {};

app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    transports[ transport.sessionId ] = transport;
    res.on("close", () => {
        delete transports[ transport.sessionId ];
    });
    await server.connect(transport);
});

app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[ sessionId ];
    if (transport) {
        await transport.handlePostMessage(req, res);
    } else {
        res.status(400).send('No transport found for sessionId');
    }
});

app.listen(3001, () => {
    console.log("Server is running on http://localhost:3001");
});
```
2. create McpServer tools
3. in server tool we pass func name,discription, schema, function
4. use zod to specify the schema
5. note: all functions inside zod are async
6. function return is a bit fancy 
7. npm i twitter-api-v2
8. create file mcp.tool.js
9.  create twitter account and give read and write access
10. get TWITTER_APP_KEY,TWITTER_APP_SECRET,TWITTER_ACCESS_TOKEN,TWITTER_ACCESS_SECRET and store them in .env
11. status contains what you are going to post which we get from client
12. run server using npx nodemon index.js