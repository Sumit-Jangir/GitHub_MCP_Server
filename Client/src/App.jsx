import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import { GoogleGenAI } from "@google/genai";
import logo from "./assets/aibot.png";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import ReactMarkdown from "react-markdown";

// In Vite, environment variables must be prefixed with VITE_
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function App() {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [tools, setTools] = useState([]);
  const [error, setError] = useState(null);
  const [mcpClient, setMcpClient] = useState(null);
  const [transport, setTransport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Scroll to bottom when chat history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

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
        currentTransport = new SSEClientTransport(
          new URL("http://localhost:3001/sse")
        );
        console.log("Transport created:", currentTransport);

        console.log("Attempting to connect to MCP server...");

        // Connect the client with the transport
        await client.connect(currentTransport);

        if (!mounted) return;

        console.log(
          "Connected to MCP server with session:",
          currentTransport.sessionId
        );
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
            setError(
              "Connected but failed to fetch tools. Some features may be limited."
            );
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
    if (!input.trim() || !isConnected || !mcpClient || !transport || isLoading)
      return;

    setIsLoading(true);
    setInput("");
    scrollToBottom();

    try {
      // Add user message to chat history
      const newHistory = [
        ...chatHistory,
        {
          role: "user",
          parts: [{ text: input, type: "text" }],
        },
      ];
      setChatHistory(newHistory);
      console.log("GEMINI_API_KEY", GEMINI_API_KEY);

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }],
          },
          ...newHistory,
        ],
        config: {
          tools: [
            {
              functionDeclarations: tools,
            },
          ],
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
          setChatHistory((prev) => [
            ...prev,
            {
              role: "model",
              parts: [{ text: toolResult.content[0].text, type: "text" }],
            },
          ]);
        } catch (toolError) {
          console.error("Tool call error:", toolError);
          setChatHistory((prev) => [
            ...prev,
            {
              role: "model",
              parts: [
                {
                  text: `Error executing tool: ${toolError.message}`,
                  type: "text",
                },
              ],
            },
          ]);

          // Check if it's a connection error and try to reconnect
          if (
            toolError.message.includes("connection") ||
            toolError.message.includes("transport")
          ) {
            setIsConnected(false);
            setError(
              "Connection lost during tool execution. Attempting to reconnect..."
            );
          }
        }
      } else {
        // Add AI response to chat history
        setChatHistory((prev) => [
          ...prev,
          {
            role: "model",
            parts: [{ text: responseText, type: "text" }],
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          parts: [{ text: `Error: ${error.message}`, type: "text" }],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {chatHistory.length === 0 && (
      <div className="w-full max-w-3xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-5xl font-bold">
          <span className="text-transparent  bg-clip-text bg-gradient-to-r from-blue-600 to-pink-500">
            GitHub MCP Server
          </span>
        </h1>
        <p className="text-gray-500 text-xl mt-2">
          Ask anything about your repositories, files, commits & more.
        </p>
      </div>
      )}

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 relative">
        <div
          ref={chatContainerRef}
          className="absolute inset-0 overflow-y-auto pt-4 pb-20 h-[87vh] scroll-smooth"
        >
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div key={index} className="flex flex-col px-4 mb-4">
                {msg.role === "model" ? (
                  <div className="flex items-start">
                    <div className="w-10 h-9 flex items-center justify-center rounded-full mr-2 mt-2">
                      <img src={logo} alt="logo" className="w-10 h-10" />
                    </div>
                    <div className="rounded-3xl px-6 py-4 max-w-[85%] text-left bg-white border border-gray-200 overflow-x-auto">
                      <div className="text-black">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 no-underline font-medium hover:text-blue-700 hover:underline active:text-blue-800 transition-all duration-200"
                              />
                            ),
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
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          ),
                        }}
                      >
                        {msg.parts[0].text}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start px-4">
                <div className="flex items-start">
                  <div className="w-10 h-9 flex items-center justify-center rounded-full mr-2 mt-2">
                    <img src={logo} alt="logo" className="w-10 h-10" />
                  </div>
                  <div className="bg-transparent rounded-lg p-4">
                    <div className="flex space-x-1">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" />
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="absolute max-w-3xl mx-auto w-full bottom-0 left-0 right-0 bg-white pt-4 pb-2 px-4">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 max-w-4xl mx-auto w-full"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isConnected
                  ? isLoading
                    ? "Waiting for response..."
                    : "Type your question..."
                  : "Connecting to server..."
              }
              disabled={!isConnected || isLoading}
              className="w-full px-4 py-3 pr-12 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || !isConnected || isLoading}
              className="absolute bg-black right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/70 rounded-full transition-colors disabled:bg-gray-400"
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
              >
                <path
                  d="M12 20V4M12 4L6 10M12 4L18 10"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500 mt-2">
          Status: {isConnected ? "Connected" : "Connecting..."}
        </div>
      </div>
    </div>
  );
}

export default App;
