# MCP Server-Client Project

A Model Context Protocol (MCP) implementation with a React client and Express.js server, featuring real-time communication through Server-Sent Events (SSE).

## Environment Setup

### Required API Keys
1. **GitHub Token** (Server)
   - Create a GitHub Personal Access Token
   - Required scopes: `repo`, `user`
   - Add to server's `.env` file as `GITHUB_TOKEN`

2. **Gemini API Key** (Client)
   - Get your API key from Google AI Studio (https://makersuite.google.com/app/apikey)
   - Add to client's `.env` file as `VITE_GEMINI_API_KEY`

### Environment File Setup
```bash
# server/.env
GITHUB_TOKEN=your_github_token_here

# client/.env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Architecture

### Real-time Communication
- Server-Sent Events (SSE) based implementation for efficient one-way communication
- Persistent connection for streaming responses from server to client
- Automatic reconnection handling and event management
- Real-time updates without polling

## Components

### Client
- Modern React application with Vite
- Key dependencies: React 19, Tailwind CSS, MCP SDK
- Features:
  - Real-time SSE communication
  - Markdown rendering with syntax highlighting
  - Responsive and modern UI with gradient styling
  - Interactive chat interface with typing indicators
  - Error handling with formatted messages

### Server
- Express.js backend with MCP SDK
- Key dependencies: Express, Octokit, Zod
- Features:
  - GitHub integration via Octokit
  - SSE endpoints for streaming responses
  - Robust error handling and validation
  - Markdown formatting support

## Quick Start

### Server Setup
```bash
cd server
npm install
# Add GITHUB_TOKEN to .env file
npm start
```

### Client Setup
```bash
cd client
npm install
# Add VITE_GEMINI_API_KEY to .env file
npm run dev   
npm run build 
```

## Available Scripts

### Client
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - ESLint check

### Server
- `npm start` - Run server with nodemon

## Detailed Examples

### GitHub Repository Management

1. **Fetching Repository Information**
   ```javascript
   // Get details about any public repository
   "Get information about the 'facebook/react' repository"
   // Response includes: stars, forks, issues, description, etc.
   
   // Get specific repository details
   "Get info about microsoft/vscode"
   ```

2. **Listing Your Repositories**
   ```javascript
   // List all repositories
   "Show me all my repositories"
   
   // Alternative command
   "List my repositories"
   ```

3. **Creating New Repositories**
   ```javascript
   // Create with description
   "Create a new repository named 'my-project' with description 'A test project'"
   
   // Simple create command
   "Create repo test-api"
   ```

### Best Practices
1. **Repository Operations**
   - Always use clear, specific repository names
   - Include descriptions when creating repos
   - Check permissions before operations

2. **Chat Usage**
   - One command per message
   - Wait for response before next command
   - Use clear, specific instructions

## Troubleshooting
- Ensure server is running before client
- Verify GitHub token permissions (server)
- Confirm Gemini API key is valid (client)
- Check console for error messages
- Verify environment variables in both client and server
- Confirm network connectivity

## Contributing
1. Fork repository
2. Create feature branch
3. Submit pull request
