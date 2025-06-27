import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { 
    fetchRepo, 
    fetchMyRepos, 
    createRepo,
    createPullRequest,
    createBranch,
    deleteBranch,
    listBranches, 
    fetchAllRepos,
    create_or_update_file,
    search_repositories,
    get_file_contents,
    list_commits,
    list_issues
} from "./github.tool.js";
import { z } from "zod";
import cors from "cors";

const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
});

// Add resources
server.resource("github_templates", {
    pull_request_templates: {
        feature: `## Feature Pull Request

**Description**
[Describe the feature you're adding]

**Changes Made**
- [List major changes]

**Testing**
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed`,

        bugfix: `## Bug Fix Pull Request

**Issue**
[Describe the bug you're fixing]

**Solution**
[Explain your solution]

**Testing**
- [ ] Regression tests added
- [ ] Bug fix verified`,

        documentation: `## Documentation Update

**Changes**
[Describe documentation changes]

**Verification**
- [ ] Documentation reviewed
- [ ] Links verified`
    },
    branch_naming: {
        feature: "feature/",
        bugfix: "bugfix/",
        hotfix: "hotfix/",
        release: "release/"
    }
});

// Add sampling functions
// server.sample("createFeatureBranch", async () => {
//     return {
//         content: [
//             {
//                 type: "text",
//                 text: `Here's how to create a feature branch:

// "Create a branch named 'feature/user-auth' in 'my-project'"

// This will:
// 1. Create a new branch with proper naming convention
// 2. Base it on the main branch
// 3. Follow best practices for feature development`
//             }
//         ]
//     };
// });

// server.sample("createPullRequest", async () => {
//     return {
//         content: [
//             {
//                 type: "text",
//                 text: `Here's how to create a pull request:

// "Create a pull request from 'feature/user-auth' to 'main' in 'my-project' titled 'Add user authentication'"

// This will:
// 1. Create a PR with proper title
// 2. Use the feature PR template
// 3. Link related issues if mentioned`
//             }
//         ]
//     };
// });

// Set up system prompt
// server.prompt({
//     system: `👋 Welcome to the GitHub Assistant!

// I can help you manage your GitHub repositories with these simple commands:

// 📁 Repository Management:
// - "Show repository details" - View info about any repository
// - "List my repositories" - See all your repositories
// - "Create new repository" - Make a new repository
//   Example: "Create a repository named 'my-project' with description 'My awesome project'"

// 🌿 Branch Operations:
// - "Create branch" - Make a new branch
//   Example: "Create branch 'feature/login' in 'my-project'"
// - "List branches" - See all branches in a repository
//   Example: "Show all branches in 'my-project'"
// - "Delete branch" - Remove a branch
//   Example: "Delete branch 'old-feature' from 'my-project'"

// 🔄 Pull Requests:
// - "Create pull request" - Make a new PR
//   Example: "Create PR from 'feature' to 'main' in 'my-project' titled 'Add new feature'"

// 📝 File Operations:
// - "Create file" - Create a new file in a repository
//   Example: "Create a file called 'README.md' in 'my-project' with content '# My Project'"
// - "Update file" - Update an existing file
//   Example: "Update config.json in 'my-project' with content '{ \"version\": \"1.0.0\" }'"

// ✨ Features:
// - Default owner is 'Sumit-jangir' (no need to specify)
// - Clear success/error messages with emojis
// - Direct links to GitHub for all operations
// - Automatic error handling and suggestions

// 📚 Resources Available:
// - PR Templates (feature, bugfix, documentation)
// - Branch naming conventions
// - Best practices guides

// 🎯 Sample Commands:
// - Ask for "sample feature branch" to see branch creation example
// - Ask for "sample pull request" to see PR creation example

// Just tell me what you'd like to do in simple words, and I'll help you out! 😊

// How can I assist you with your GitHub tasks today?`
// });

// ... set up server resources, tools, and prompts ...

const app = express();
app.use(cors({
    origin: '*', // Be more restrictive in production
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
server.tool(
    "addTwoNumbers",
    "Add two numbers",
    {
        a: z.number(),
        b: z.number()
    },
    async (arg) => {
        const { a, b } = arg;
        return {
            content: [
                {
                    type: "text",
                    text: `The sum of ${a} and ${b} is ${a + b}`
                }
            ]
        }
    }
)
*/

// GitHub Tools
server.tool(
    "fetchRepo",
    "Fetch GitHub repository information", 
    {
        owner: z.string(),
        repo: z.string()
    }, 
    async (arg) => {
        try {
            const { owner, repo } = arg;
            return await fetchRepo(owner, repo);
        } catch (error) {
            console.error("Error in fetchRepo tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error.message || "Unknown error occurred while fetching repository"}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "fetchAllRepos",
    "Fetch all GitHub repositories for a user", 
    {
        username: z.string()
    }, 
    async (arg) => {
        try {
            const { username } = arg;
            return await fetchAllRepos(username);
        } catch (error) {
            console.error("Error in fetchAllRepos tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error.message || "Unknown error occurred while fetching repositories"}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "fetchMyRepos",
    "Fetch all repositories for the authenticated GitHub user", 
    {}, 
    async () => {
        try {
            return await fetchMyRepos();
        } catch (error) {
            console.error("Error in fetchMyRepos tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error.message || "Unknown error occurred while fetching your repositories"}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "createRepo",
    "Create a new GitHub repository for the authenticated user", 
    {
        name: z.string(),
        description: z.string().optional(),
        isPrivate: z.boolean().optional()
    }, 
    async (arg) => {
        try {
            const { name, description = "", isPrivate = false } = arg;
            return await createRepo(name, description, isPrivate);
        } catch (error) {
            console.error("Error in createRepo tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error.message || "Unknown error occurred while creating repository"}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "createPullRequest",
    "Create a new pull request on GitHub", 
    {
        owner: z.string().optional(),
        repo: z.string(),
        title: z.string(),
        body: z.string().optional(),
        head: z.string(),
        base: z.string().optional()
    }, 
    async (arg) => {
        // Add a default description if not provided
        const { 
            owner = "Sumit-jangir", 
            repo, 
            title, 
            body = "Pull request created via GitHub tool", 
            head, 
            base = 'main' 
        } = arg;

        // Return immediately with status to prevent multiple calls
        const initialResponse = {
            content: [
                {
                    type: "text",
                    text: `⏳ Creating pull request...

Details:
- Repository: ${owner}/${repo}
- Title: ${title}
- From: ${head}
- To: ${base}

The pull request URL will appear here once created...
Please wait while the pull request is being created...`
                }
            ]
        };

        try {
            const result = await createPullRequest(owner, repo, title, body, head, base);
            // Ensure the URL is in the response
            if (result.content?.[0]?.text && !result.content[0].text.includes('Pull Request URL')) {
                const prUrl = `https://github.com/${owner}/${repo}/pull/`;
                result.content[0].text = `✅ Pull request created successfully!

🔗 Pull Request URL:
${prUrl}

${result.content[0].text}`;
            }
            return result;
        } catch (error) {
            console.error("Error in createPullRequest tool:", error);
            if (error.message?.includes('rate limit')) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `⚠️ Rate limit exceeded. Please wait a few minutes before trying again.

Error details: ${error.message}

Note: Once the rate limit resets, you can try creating the pull request at:
https://github.com/${owner}/${repo}/compare/${base}...${head}`
                        }
                    ]
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error creating pull request: ${error.message || "Unknown error occurred while creating pull request"}

You can try creating the pull request manually at:
https://github.com/${owner}/${repo}/compare/${base}...${head}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "createBranch",
    "Create a new branch in a GitHub repository", 
    {
        owner: z.string(),
        repo: z.string(),
        branchName: z.string(),
        sourceBranch: z.string().optional()
    }, 
    async (arg) => {
        try {
            const { owner, repo, branchName, sourceBranch = 'main' } = arg;
            return await createBranch(owner, repo, branchName, sourceBranch);
        } catch (error) {
            console.error("Error in createBranch tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error.message || "Unknown error occurred while creating branch"}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "deleteBranch",
    "Delete a branch from a GitHub repository", 
    {
        owner: z.string().optional(),
        repo: z.string(),
        branchName: z.string()
    }, 
    async (arg) => {
        try {
            const { owner = "Sumit-jangir", repo, branchName } = arg;
            const result = await deleteBranch(owner, repo, branchName);
            return {
                content: [
                    {
                        type: "text",
                        text: `Deleting branch '${branchName}' from ${owner}/${repo}...`
                    },
                    ...result.content
                ]
            };
        } catch (error) {
            console.error("Error in deleteBranch tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error.message || "Unknown error occurred while deleting branch"}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "listBranches",
    "List all branches in a GitHub repository", 
    {
        owner: z.string(),
        repo: z.string()
    }, 
    async (arg) => {
        try {
            const { owner, repo } = arg;
            return await listBranches(owner, repo);
        } catch (error) {
            console.error("Error in listBranches tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error.message || "Unknown error occurred while listing branches"}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "create_or_update_file",
    "Create a new file or update an existing file in a GitHub repository", 
    {
        owner: z.string().optional(),
        repo: z.string(),
        path: z.string(),
        content: z.string(),
        message: z.string(),
        branch: z.string().optional(),
        encoding: z.string().optional()
    }, 
    async (arg) => {
        try {
            const { 
                owner = "Sumit-jangir", 
                repo, 
                path, 
                content, 
                message, 
                branch = 'main',
                encoding = 'utf-8'
            } = arg;
            return await create_or_update_file(owner, repo, path, content, message, branch, encoding);
        } catch (error) {
            console.error("Error in create_or_update_file tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error creating/updating file: ${error.message || "Unknown error occurred while creating/updating file"}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "search_repositories",
    "Search for GitHub repositories with various criteria", 
    {
        query: z.string(),
        sort: z.enum(['stars', 'forks', 'help-wanted-issues', 'updated']).optional(),
        order: z.enum(['desc', 'asc']).optional(),
        per_page: z.number().min(1).max(100).optional()
    }, 
    async (arg) => {
        try {
            const { query, sort = 'stars', order = 'desc', per_page = 10 } = arg;
            return await search_repositories(query, sort, order, per_page);
        } catch (error) {
            console.error("Error in search_repositories tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error searching repositories: ${error.message || "Unknown error occurred while searching repositories"}`
                    }
                ]
            };
        }
    }
)

server.tool(
    "get_file_contents",
    "Get the contents of a file or directory from a GitHub repository", 
    {
        owner: z.string().optional(),
        repo: z.string(),
        path: z.string(),
        ref: z.string().optional()
    }, 
    async (arg) => {
        try {
            const { owner = "Sumit-jangir", repo, path, ref = 'main' } = arg;
            return await get_file_contents(owner, repo, path, ref);
        } catch (error) {
            console.error("Error in get_file_contents tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `**Error Report**\n

**Status:** Failed to fetch file contents\n
**Error Message:** ${error.message || "Unknown error"}\n

Please verify your access permissions and try again.`
                    }
                ]
            };
        }
    }
)

server.tool(
    "list_commits",
    "List commits for a repository or specific file/directory", 
    {
        owner: z.string().optional(),
        repo: z.string(),
        path: z.string().optional(),
        per_page: z.number().min(1).max(100).optional()
    }, 
    async (arg) => {
        try {
            const { owner = "Sumit-jangir", repo, path = '', per_page = 10 } = arg;
            return await list_commits(owner, repo, path, per_page);
        } catch (error) {
            console.error("Error in list_commits tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `**Error Report**\n

**Status:** Failed to fetch commits\n
**Error Message:** ${error.message || "Unknown error"}\n

Please verify your access permissions and try again.`
                    }
                ]
            };
        }
    }
)

server.tool(
    "list_issues",
    "List issues in a GitHub repository", 
    {
        owner: z.string().optional(),
        repo: z.string(),
        state: z.enum(['open', 'closed', 'all']).optional(),
        per_page: z.number().min(1).max(100).optional()
    }, 
    async (arg) => {
        try {
            const { owner = "Sumit-jangir", repo, state = 'open', per_page = 10 } = arg;
            return await list_issues(owner, repo, state, per_page);
        } catch (error) {
            console.error("Error in list_issues tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `**Error Report**\n

**Status:** Failed to fetch issues\n
**Error Message:** ${error.message || "Unknown error"}\n

Please verify your access permissions and try again.`
                    }
                ]
            };
        }
    }
)

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
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
    console.log("Received message for session:", sessionId);
    const transport = transports[ sessionId ];
    if (transport) {
        await transport.handlePostMessage(req, res, req.body);
    } else {
        res.status(400).send('No transport found for sessionId');
    }
});


app.listen(3001, () => {
    console.log("Server is running on http://localhost:3001");
    console.log("GitHub API status: " + (process.env.GITHUB_TOKEN ? "Configured" : "Not configured - will use simulation mode"));
});