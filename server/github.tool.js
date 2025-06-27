import { config } from "dotenv";
import { Octokit } from "octokit";
config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function fetchRepo(owner, repo) {
  try {
    const response = await octokit.rest.repos.get({
      owner,
      repo,
    });

    return {
      content: [
        {
          type: "text",
          text: `**Repository:** ${response.data.full_name}  
**Description:** ${response.data.description || "No description"}  
**Stars:** ${response.data.stargazers_count}  
**Forks:** ${response.data.forks_count}  
**Open Issues:** ${response.data.open_issues_count}  
**URL:** [${response.data.html_url}](${response.data.html_url})  
`,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching repository:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error fetching repository: ${
            error.message || "Unknown error"
          }`,
        },
      ],
    };
  }
}

export async function fetchAllRepos(username) {
  try {
    const response = await octokit.rest.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 100
    });

    if (response.data.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No repositories found for user: ${username}`
          }
        ],
      };
    }

    const repoList = response.data.map((repo, i) => {
      return `### **${i + 1}. Repository:** ${repo.full_name}  
**Description:** ${repo.description || 'No description'}  
**Stars:** ${repo.stargazers_count}  
**Forks:** ${repo.forks_count}  
**URL:** [${repo.html_url}](${repo.html_url})  
      
---`;
    }).join('\n\n');

    return {
      content: [
        {
          type: "text",
          text: `**Repositories for ${username}:**\n\n${repoList}`
        }
      ],
    };
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error fetching repositories: ${error.message || "Unknown error"}`
        }
      ],
    };
  }
}

export async function fetchMyRepos() {
  try {
    // Get authenticated user's information
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log("Authenticated as:", user.login); // Debug log
    
    // Get all repositories for the authenticated user
    const response = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      visibility: 'all' // Include both public and private repos
    });
    
    console.log("Found repositories:", response.data.length); // Debug log

    if (response.data.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No repositories found for your account: ${user.login}`
          }
        ],
      };
    }

    const repoList = response.data.map((repo, i) => {
      return `### **${i + 1}. Repository:** ${repo.full_name}  
**Description:** ${repo.description || 'No description'}  
**Stars:** ${repo.stargazers_count}  
**Forks:** ${repo.forks_count}  
**URL:** [${repo.html_url}](${repo.html_url})  

---`;
    }).join('\n\n');

    return {
      content: [
        {
          type: "text",
          text: `**Your repositories (${user.login}):**\n\n${repoList}`
        }
      ],
    };
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error fetching repositories: ${error.message || "Unknown error"}`
        }
      ],
    };
  }
}

export async function createRepo(name, description = "", isPrivate = false) {
  try {
    // Get authenticated user's information
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`Creating repository '${name}' for user ${user.login}`);
    
    // Create a new repository
    const response = await octokit.rest.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
      auto_init: true // Initialize with a README
    });
    
    return {
      content: [
        {
          type: "text",
          text: `✅ **Repository created successfully!**

**Repository:** ${response.data.full_name}  
**Description:** ${response.data.description || 'No description'}  
**Visibility:** ${response.data.private ? 'Private' : 'Public'}  
**URL:** [${response.data.html_url}](${response.data.html_url})  

\`\`\`bash
git clone ${response.data.clone_url}
\`\`\`
`
        }
      ]
    };
  } catch (error) {
    console.error("Error creating repository:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error creating repository: ${error.message || "Unknown error"}`
        }
      ]
    };
  }
}

export async function createPullRequest(owner = "Sumit-jangir", repo, title, body, head, base = 'main') {
  try {
    console.log(`Attempting to create pull request in ${owner}/${repo} from ${head} to ${base}`);

    // First verify the repository exists
    try {
      await octokit.rest.repos.get({
        owner,
        repo,
      });
    } catch (repoError) {
      console.error("Error verifying repository:", repoError);
      return {
        content: [
          {
            type: "text",
            text: `❌ Unable to create pull request: Repository '${owner}/${repo}' not found or not accessible.\nPlease verify:\n1. The repository name is correct (case-sensitive)\n2. The repository exists\n3. You have permission to access it\n4. The repository is not private`
          }
        ]
      };
    }

    // Verify source branch exists
    try {
      await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${head}`
      });
    } catch (branchError) {
      console.error("Error verifying source branch:", branchError);
      return {
        content: [
          {
            type: "text",
            text: `❌ Unable to create pull request: Source branch '${head}' not found.\nPlease verify:\n1. The branch name is spelled correctly\n2. The branch exists in the repository\n3. You have permission to access this branch`
          }
        ]
      };
    }

    // Verify target branch exists
    try {
      await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${base}`
      });
    } catch (branchError) {
      console.error("Error verifying target branch:", branchError);
      return {
        content: [
          {
            type: "text",
            text: `❌ Unable to create pull request: Target branch '${base}' not found.\nPlease verify:\n1. The branch name is spelled correctly\n2. The branch exists in the repository\n3. You have permission to access this branch`
          }
        ]
      };
    }

    // Check if there are differences between branches
    try {
      const comparison = await octokit.rest.repos.compareCommits({
        owner,
        repo,
        base,
        head
      });

      if (comparison.data.total_commits === 0) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Cannot create pull request: No differences found between '${base}' and '${head}'.\n              \n**Details:**\n- **Repository:** ${owner}/${repo}\n- **Source branch:** ${head}\n- **Target branch:** ${base}\n- **Status:** No changes to merge\n\nPlease make sure:\n1. You have committed changes to the source branch\n2. The changes are not already merged\n3. You're using the correct branch names`
            }
          ]
        };
      }
    } catch (compareError) {
      console.error("Error comparing branches:", compareError);
    }

    // Create the pull request
    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ **Pull request created successfully!**

🔗 **Pull Request URL:**  
[${response.data.html_url}](${response.data.html_url})

**Details:**  
- **Title:** ${response.data.title}  
- **Number:** #${response.data.number}  
- **Status:** ${response.data.state}  
- **From:** ${head}  
- **To:** ${base}  

**Description:**  
${response.data.body || 'No description provided'}

_Created at: ${new Date(response.data.created_at).toLocaleString()}_
`
        }
      ]
    };
  } catch (error) {
    console.error("Error creating pull request:", error);
    return {
      content: [
        {
          type: "text",
          text: `❌ Error creating pull request: ${error.message || "Unknown error"}

Please check:\n1. You have the necessary permissions\n2. The branches exist and have different commits\n3. There isn't already an open pull request\n4. The GitHub token has sufficient permissions\n\n**Repository:** ${owner}/${repo}\n**From:** ${head}\n**To:** ${base}\n**Time:** ${new Date().toLocaleString()}`
        }
      ]
    };
  }
}

export async function createBranch(owner="Sumit-jangir", repo, branchName, sourceBranch = 'main') {
  try {
    // Get the SHA of the source branch
    const { data: sourceRef } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${sourceBranch}`
    });

    // Create new branch from the source branch's SHA
    const response = await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: sourceRef.object.sha
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ **Branch created successfully!**

**Name:** ${branchName}  
**Created from:** ${sourceBranch}  
**SHA:** ${response.data.object.sha}  
**URL:** [${response.data.url}](${response.data.url})  
`
        }
      ]
    };
  } catch (error) {
    console.error("Error creating branch:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error creating branch: ${error.message || "Unknown error"}`
        }
      ]
    };
  }
}

export async function deleteBranch(owner = "Sumit-jangir", repo, branchName) {
  try {
    console.log(`Attempting to delete branch '${branchName}' from ${owner}/${repo}`);

    // First verify the repository exists
    try {
      await octokit.rest.repos.get({
        owner,
        repo,
      });
    } catch (repoError) {
      console.error("Error verifying repository:", repoError);
      return {
        content: [
          {
            type: "text",
            text: `Unable to delete branch: Repository '${owner}/${repo}' not found or not accessible.\nPlease verify:\n1. The repository name is correct (case-sensitive)\n2. The repository exists\n3. You have permission to access it\n4. The repository is not private`
          }
        ]
      };
    }

    // Verify branch exists before trying to delete
    try {
      await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branchName}`
      });
    } catch (branchError) {
      console.error("Error verifying branch:", branchError);
      return {
        content: [
          {
            type: "text",
            text: `Unable to delete branch: Branch '${branchName}' not found in repository '${owner}/${repo}'.\nPlease verify:\n1. The branch name is spelled correctly (case-sensitive)\n2. The branch exists in the repository\n3. You have permission to access this branch`
          }
        ]
      };
    }

    // If both repository and branch exist, proceed with deletion
    await octokit.rest.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ **Branch deleted successfully!**

**Repository:** ${owner}/${repo}  
**Branch:** ${branchName}  
**Status:** Deleted  
**Time:** ${new Date().toLocaleString()}  

> _Note: This action cannot be undone. If you need to recover this branch, you'll need to create it again._
`
        }
      ]
    };
  } catch (error) {
    console.error("Error deleting branch:", error);
    return {
      content: [
        {
          type: "text",
          text: `❌ Error deleting branch: ${error.message || "Unknown error"}

Please check:\n1. You have the necessary permissions to delete branches\n2. The branch is not protected\n3. The branch is not the default branch\n4. The GitHub token has sufficient permissions\n\n**Repository:** ${owner}/${repo}\n**Branch:** ${branchName}\n**Time:** ${new Date().toLocaleString()}`
        }
      ]
    };
  }
}

export async function listBranches(owner = "Sumit-jangir", repo) {
  try {
    console.log(`Attempting to list branches for ${owner}/${repo}`);
    
    // First verify the repository exists
    try {
      await octokit.rest.repos.get({
        owner,
        repo,
      });
    } catch (repoError) {
      console.error("Error verifying repository:", repoError);
      return {
        content: [
          {
            type: "text",
            text: `Repository '${owner}/${repo}' not found or not accessible. Please verify:\n1. The repository name is correct (case-sensitive)\n2. The repository exists\n3. You have permission to access it\n4. The repository is not private`
          }
        ]
      };
    }

    // If repository exists, get branches
    const response = await octokit.rest.repos.listBranches({
      owner,
      repo,
      per_page: 100
    });

    console.log(`Found ${response.data.length} branches in ${owner}/${repo}`);

    if (response.data.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No branches found in repository ${owner}/${repo}. This might be a new repository.`
          }
        ]
      };
    }

    const branchList = response.data.map((branch, i) => {
      return `${i + 1}. **Branch:** ${branch.name}  
**SHA:** ${branch.commit.sha}  
**Protected:** ${branch.protected ? 'Yes' : 'No'}  

---`;
    }).join('\n\n');

    return {
      content: [
        {
          type: "text",
          text: `**Branches in ${owner}/${repo}:**\n\n${branchList}`
        }
      ]
    };
  } catch (error) {
    console.error("Error listing branches:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error listing branches: ${error.message || "Unknown error"}\nPlease ensure:\n1. The repository name is spelled correctly (case-sensitive)\n2. You have the correct permissions\n3. The repository exists\n4. The GitHub token has the necessary permissions`
        }
      ]
    };
  }
}

export async function create_or_update_file(owner = "Sumit-jangir", repo, path, content, message, branch = 'main', encoding = 'utf-8') {
  try {
    console.log(`Attempting to create/update file '${path}' in ${owner}/${repo} on branch ${branch}`);

    // First verify the repository exists
    try {
      await octokit.rest.repos.get({
        owner,
        repo,
      });
    } catch (repoError) {
      console.error("Error verifying repository:", repoError);
      return {
        content: [
          {
            type: "text",
            text: `❌ Unable to create/update file: Repository '${owner}/${repo}' not found or not accessible.\nPlease verify:\n1. The repository name is correct (case-sensitive)\n2. The repository exists\n3. You have permission to access it\n4. The repository is not private`
          }
        ]
      };
    }

    // Try to get the file first to see if it exists
    let sha;
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });
      sha = fileData.sha;
      console.log(`File exists. Will update existing file with SHA: ${sha}`);
    } catch (error) {
      // File doesn't exist, which is fine - we'll create it
      console.log(`File doesn't exist. Will create new file.`);
    }

    // Create or update the file
    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content, encoding).toString('base64'),
      branch,
      ...(sha && { sha }) // Only include sha if file exists
    });

    const action = sha ? 'updated' : 'created';
    return {
      content: [
        {
          type: "text",
          text: `✅ **File ${action} successfully!**\n

**Repository:** ${owner}/${repo}\n
**File:** ${path}\n
**Branch:** ${branch}\n
**Commit:** [${response.data.commit.sha.substring(0, 7)}](${response.data.commit.html_url})\n
**Message:** ${message}\n

**You can view the file :-** 🔗[click here](${response.data.content.html_url})`
        }
      ]
    };
  } catch (error) {
    console.error("Error creating/updating file:", error);
    return {
      content: [
        {
          type: "text",
          text: `❌ Error creating/updating file: ${error.message || "Unknown error"}`
        }
      ]
    };
  }
}

export async function search_repositories(query, sort = 'stars', order = 'desc', per_page = 10) {
  try {
    console.log(`Searching repositories with query: "${query}"`);

    const response = await octokit.rest.search.repos({
      q: query,
      sort: sort,
      order: order,
      per_page: per_page
    });

    if (response.data.total_count === 0) {
      return {
        content: [
          {
            type: "text",
            text: `📊 **Search Results Summary**\n

**Query:** "${query}"\n
**Total Results:** 0\n
**Status:** No matches found\n

**Suggestions:**\n
1. Try using different keywords
2. Check for spelling errors
3. Use more general search terms
4. Remove specific filters`
          }
        ]
      };
    }

    const repoList = response.data.items.map((repo, i) => {
      const topics = repo.topics?.length > 0 ? `**Topics:** ${repo.topics.join(', ')}\n\n` : '';
      const language = repo.language ? `**Primary Language:** ${repo.language}\n\n` : '';
      const license = repo.license?.name ? `**License:** ${repo.license.name}\n\n` : '';
      
      return `**Repository ${i + 1}**\n
**Name:** [${repo.full_name}](${repo.html_url})\n
**Description:** ${repo.description || 'No description provided'}\n
${language}${license}${topics}**Statistics:**\n
• Stars: ${repo.stargazers_count.toLocaleString()}
• Forks: ${repo.forks_count.toLocaleString()}
• Watchers: ${repo.watchers_count.toLocaleString()}
• Open Issues: ${repo.open_issues_count.toLocaleString()}\n

**Last Updated:** ${new Date(repo.updated_at).toLocaleString()}\n
**Created At:** ${new Date(repo.created_at).toLocaleString()}\n

---\n`;
    }).join('\n');

    return {
      content: [
        {
          type: "text",
          text: `**Search Results Summary**\n

**Query:** "${query}"\n
**Total Results:** ${response.data.total_count.toLocaleString()}\n
**Sort Criteria:** ${sort}\n
**Order:** ${order}\n
**Results Per Page:** ${per_page}\n

**Top ${Math.min(per_page, response.data.items.length)} Repositories:**\n
${repoList}\n
**Note:** Results are sorted by ${sort} in ${order}ending order. Use different sort criteria or page size for different results.`
        }
      ]
    };
  } catch (error) {
    console.error("Error searching repositories:", error);
    if (error.status === 422) {
      return {
        content: [
          {
            type: "text",
            text: `❌ **Search Query Error Report**\n

**Query:** "${query}"\n
**Status:** Invalid Query\n
**Error Code:** 422\n

**Troubleshooting Steps:**\n
1. Simplify search terms
2. Remove special characters
3. Verify syntax correctness\n

**Reference:**\n
For detailed search syntax guidelines, please refer to:\n
🔗 [GitHub Search Documentation](https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax)`
          }
        ]
      };
    }
    if (error.status === 403) {
      return {
        content: [
          {
            type: "text",
            text: `⚠️ **Rate Limit Report**\n

**Status:** Rate Limit Exceeded\n
**Error Code:** 403\n

**Resolution Steps:**\n
1. Wait for rate limit reset (typically 60 minutes)
2. Use more specific search terms
3. Reduce request frequency\n

**Best Practices:**\n
• Cache frequently accessed results
• Implement request throttling
• Use conditional requests when possible`
          }
        ]
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `❌ **Error Report**\n

**Status:** Search Operation Failed\n
**Error Message:** ${error.message || "Unknown error"}\n
**Time:** ${new Date().toLocaleString()}\n

Please contact support if this issue persists.`
        }
      ]
    };
  }
}
