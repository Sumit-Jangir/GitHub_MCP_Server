import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { GoogleGenAI } from "@google/genai";
import logo from './assets/aibot.png';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { SYSTEM_PROMPT } from './systemPrompt.js';
import ReactMarkdown from 'react-markdown';

// In Vite, environment variables must be prefixed with VITE_
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function App() {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [tools, setTools] = useState([]);
  const [error, setError] = useState(null);
  const [mcpClient, setMcpClient] = useState(null);
  const [transport, setTransport] = useState(null);

  // Initialize MCP client and tools
  useEffect(() => {
    let mounted = true;
    let currentTransport = null;

    const initializeMCP = async () => {
      try {
        // Create a new client instance
        const client = new Client({
          name: "example-client",
          version: "1.0.0",
        });

        // Create the SSE transport with the base URL
        currentTransport = new SSEClientTransport(new URL("http://localhost:3001/sse"));
        console.log("Transport created:", currentTransport);
        
        console.log("Attempting to connect to MCP server...");
        
        // Connect the client with the transport
        await client.connect(currentTransport);

        if (!mounted) return;

        console.log("Connected to MCP server with session:", currentTransport.sessionId);
        setTransport(currentTransport);
        setMcpClient(client);
        setIsConnected(true);
        setError(null);

        // Fetch available tools
        try {
          const toolsList = (await client.listTools()).tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: {
              type: tool.inputSchema.type,
              properties: tool.inputSchema.properties,
              required: tool.inputSchema.required,
            },
          }));

          console.log("Tools fetched:", toolsList);
          if (mounted) {
            setTools(toolsList);
          }
        } catch (toolError) {
          console.error("Failed to fetch tools:", toolError);
          if (mounted) {
            setError("Connected but failed to fetch tools. Some features may be limited.");
          }
        }
      } catch (error) {
        console.error("Failed to connect to MCP server:", error);
        if (mounted) {
          setError(`Connection failed: ${error.message}`);
          setIsConnected(false);
        }
      }
    };

    initializeMCP();

    // Set up an interval to check connection status
    // const connectionCheck = setInterval(() => {
    //   if (currentTransport && !currentTransport.isConnected()) {
    //     console.log("Connection lost, attempting to reconnect...");
    //     setIsConnected(false);
    //     setError("Connection lost. Attempting to reconnect...");
    //     initializeMCP();
    //   }
    // }, 5000);

    // Cleanup function
    return () => {
      mounted = false;
      // clearInterval(connectionCheck);
      if (currentTransport) {
        currentTransport.close();
      }
      if (mcpClient) {
        mcpClient.disconnect();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Input:", input);
    console.log("Is connected:", isConnected);
    console.log("MCP client:", mcpClient);
    console.log("Transport:", transport);
    if (!input.trim() || !isConnected || !mcpClient || !transport) return;

    try {
      // Add user message to chat history
      const newHistory = [...chatHistory, {
        role: "user",
        parts: [{ text: input, type: "text" }]
      }];
      setChatHistory(newHistory);
      console.log("GEMINI_API_KEY", GEMINI_API_KEY);

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }]
          },
          ...newHistory
        ],
        config: {
          tools: [{
            functionDeclarations: tools,
          }],
        },
      });

      console.log("Response:", response);

      const functionCall = response.candidates[0].content.parts[0].functionCall;
      const responseText = response.candidates[0].content.parts[0].text;

      if (functionCall) {
        console.log("Tool call:", functionCall);
        try {
          const toolResult = await mcpClient.callTool({
            name: functionCall.name,
            arguments: functionCall.args,
          });

          // Add tool result to chat history
          setChatHistory(prev => [...prev, {
            role: "model",
            parts: [{ text: toolResult.content[0].text, type: "text" }]
          }]);
        } catch (toolError) {
          console.error("Tool call error:", toolError);
          setChatHistory(prev => [...prev, {
            role: "model",
            parts: [{ text: `Error executing tool: ${toolError.message}`, type: "text" }]
          }]);

          // Check if it's a connection error and try to reconnect
          if (toolError.message.includes('connection') || toolError.message.includes('transport')) {
            setIsConnected(false);
            setError("Connection lost during tool execution. Attempting to reconnect...");
          }
        }
      } else {
        // Add AI response to chat history
        setChatHistory(prev => [...prev, {
          role: "model",
          parts: [{ text: responseText, type: "text" }]
        }]);
      }

    } catch (error) {
      console.error("Error generating response:", error);
      setChatHistory(prev => [...prev, {
        role: "model",
        parts: [{ text: `Error: ${error.message}`, type: "text" }]
      }]);
    }

    setInput('');
  };

  console.log("chatHistory:", chatHistory);

  // const handleRetryConnection = useCallback(async () => {
  //   setError(null);
  //   setIsConnected(false);
  //   setMcpClient(null);
  //   if (transport) {
  //     transport.close();
  //   }
  //   setTransport(null);
  // }, [transport]);

  // const formatMessage = (text) => {
  //   // Split the message by newlines and format each part
  //   return text.split('\n').map((line, i) => {
  //     if (line.startsWith('*')) {
  //       return <li key={i} className="list-disc ml-4 text-gray-800">{line.substring(1)}</li>;
  //     }
  //     if (line.startsWith('-')) {
  //       return <li key={i} className="list-disc ml-4 text-gray-800">{line.substring(1)}</li>;
  //     }
  //     if (line.trim().startsWith('```')) {
  //       return <pre key={i} className="bg-gray-100 p-2 rounded my-1 font-mono text-sm">{line.replace(/```/g, '')}</pre>;
  //     }
  //     return <p key={i} className="mb-1">{line}</p>;
  //   });
  // };


  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 relative">
        <div className="absolute inset-0 overflow-y-auto pt-4 pb-32">
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div key={index} className="flex flex-col px-4 mb-4">
                {msg.role === 'model' ? (
                  <div className="flex items-start">
                    <div className="w-10 h-9 flex items-center justify-center rounded-full mr-2 mt-2">
                      <img src={logo} alt="logo" className="w-10 h-10" />
                    </div>
                    <div className="rounded-3xl px-6 py-4 max-w-[85%] text-left bg-white border border-gray-200">
                      <div className="text-gray-800">
                        <ReactMarkdown
                          components={{
                            a: ({node, ...props}) => (
                              <a {...props} target="_blank" rel="noopener noreferrer" />
                            )
                          }}
                        >
                          {msg.parts[0].text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="rounded-3xl px-6 py-4 max-w-[85%] text-left bg-blue-500 text-white ml-auto">
                      <ReactMarkdown
                        components={{
                          a: ({node, ...props}) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" />
                          )
                        }}
                      >
                        {msg.parts[0].text}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-2 px-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isConnected ? "Type your message..." : "Connecting to server..."}
              disabled={!isConnected}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
            <button 
              type="submit" 
              disabled={!isConnected}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
              Send
            </button>
          </form>
          
          <div className="text-center text-sm text-gray-500 mt-2">
            Status: {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
