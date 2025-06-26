# MCP Client with Enhanced Response Formatting

This React application provides a chat interface for interacting with various tools through MCP (Model Context Protocol), with enhanced response formatting for better user experience.

## Features

- **Universal Tool Support**: Works with any MCP tool, not just GitHub repositories
- **System Prompt Integration**: AI responses are guided by a comprehensive system prompt for consistent formatting
- **Clean Data Display**: All tool responses are automatically formatted in a clean, organized manner
- **Interactive UI**: User-friendly interface with organized information display
- **Real-time Chat**: Seamless conversation flow with MCP tools

## System Prompt

The application uses a sophisticated system prompt (`src/systemPrompt.js`) that instructs the AI to format responses for all tools consistently:

### For All Tool Responses:
- Present information clearly with proper structure and formatting
- Use appropriate formatting for different types of data (lists, tables, cards, code blocks)
- Add context and explanations to help users understand the data
- Provide actionable suggestions for next steps

### For GitHub Repository Data:
- Group repositories by owner if there are multiple owners
- Present each repository with name, description, stars, and forks
- Add summary counts and provide context about available actions
- Make URLs clickable-friendly

### For File System Operations:
- Present file/directory information in a structured format
- Show relevant details like size, permissions, dates
- Organize information logically (by type, size, date, etc.)
- Provide context about what the user can do with the files

### For Code/Text Operations:
- Format code with proper syntax highlighting
- Present text in readable chunks
- Use appropriate formatting for different content types
- Add explanations for complex operations

### General Guidelines:
- Conversational and helpful tone
- Always provide context about available actions
- Suggest next steps users might want to take
- Use emojis sparingly but effectively when appropriate

## Key Improvements

1. **Universal Formatting**: The system prompt works for all MCP tools, not just repositories
2. **System Prompt Integration**: AI responses are guided by a comprehensive prompt for consistent formatting
3. **Better User Experience**: All tool data is presented in an organized, visually appealing way
4. **Actionable Suggestions**: Users get helpful hints about what they can do next
5. **No Custom Parsing**: Relies entirely on the AI's understanding and formatting capabilities

## Usage

1. Start the MCP server
2. Run the React application
3. Ask questions about any available tools
4. Enjoy clean, formatted responses for all tool outputs

## Example Response Format

Instead of raw data, you'll get formatted responses like:

```
📋 GitHub Repository Results:

**Summary**: Found 5 repositories for user "example"

**Details**:
- **MyProject**: A web application built with React
  ⭐ 15 stars | 🍴 3 forks
  [View Repository](https://github.com/example/MyProject)

- **DataProcessor**: Python library for data analysis
  ⭐ 8 stars | 🍴 1 fork
  [View Repository](https://github.com/example/DataProcessor)

**Next Steps**: You can ask me to get more details about any specific repository or perform other GitHub operations.

**Available Actions**: Create repository, create pull request, list branches, etc.
```

## Customization

You can modify the system prompt in `src/systemPrompt.js` to adjust:
- Response formatting style for different tool types
- Tone and communication style
- Information organization patterns
- Available actions and suggestions

The system prompt is designed to be easily customizable while maintaining consistent, user-friendly formatting across all tools.
