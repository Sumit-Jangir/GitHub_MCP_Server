# MCP Server-Client Project

This project demonstrates the Model Context Protocol (MCP) with a server that provides tools and a client that uses an AI model to interact with those tools.

## Project Structure

- `server/`: MCP server implementation with Express.js
- `client/`: Client application using Google's Gemini AI

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- A Gemini API key from Google AI Studio
- A GitHub Personal Access Token (for repository access)

### Server Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the server directory:
   ```
   # GitHub API credentials (optional - leave empty to use simulation mode)
   GITHUB_TOKEN=your_github_personal_access_token
   ```

   Note: Your GitHub token must have the 'repo' scope to create and access repositories.

4. Start the server:
   ```
   node index.js
   ```

### Client Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the client directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the client:
   ```
   node index.js
   ```

## Usage

1. Start the server first, then the client in a separate terminal.
2. The client provides a chat interface where you can interact with the AI.
3. The AI can use tools provided by the server:
   - `addTwoNumbers`: Adds two numbers together
   - `fetchRepo`: Fetches GitHub repository information for a specific repository
   - `fetchMyRepos`: Fetches all GitHub repositories for the authenticated user
   - `createRepo`: Creates a new GitHub repository for the authenticated user

## Troubleshooting

- If you see connection errors, make sure the server is running before starting the client.
- If GitHub API calls fail, check your GitHub token is valid and has the necessary permissions.
- For Gemini API issues, verify your API key is correct and has the necessary permissions.

## Example Commands

- Add two numbers: "Can you add 5 and 7 for me?"
- Fetch repository info: "Get information about the 'facebook/react' repository"
- Fetch all repositories: "Show me all my repositories"
- Create a repository: "Create a new repository named 'my-project' with description 'A test project'"
- Exit the chat: Type "exit" or "quit" 