const axios = require('axios');
const readlineSync = require('readline-sync');
const fs = require('fs');
const path = require('path');

async function fetchLeetCodeDetails(url) {
  try {
    // Extract the problem slug from the URL
    const urlParts = url.split('/');
    const problemIndex = urlParts.indexOf('problems')
    const titleSlug = urlParts[problemIndex + 1];

    // Define the GraphQL query
    const query = `
      query {
        question(titleSlug: "${titleSlug}") {
          title
          difficulty
          questionFrontendId
        }
      }
    `;

    // Make the POST request to LeetCode's GraphQL API
    const response = await axios.post('https://leetcode.com/graphql', { query }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Extract the problem details from the response
    const problem = response.data.data.question;

    if (problem) {
      console.log(`Title: ${problem.title}`);
      console.log(`Difficulty: ${problem.difficulty}`);
      console.log(`Question Number: ${problem.questionFrontendId}`);

      // Convert difficulty to lowercase
      const difficultyDir = path.join(__dirname, '../', 'book_sources', problem.difficulty.toLowerCase());

      // Check if the directory exists
      if (!fs.existsSync(difficultyDir)) {
        throw new Error(`Directory "${difficultyDir}" does not exist.`);
      }

      // Create the markdown content
      const markdownContent = `
# ${problem.questionFrontendId}. ${problem.title}

> [Leetcode link](https://leetcode.com/problems/${titleSlug})

## 题目简介

(Add problem description here)

## 解题思路

(Add your solution approach here)

### Javascript

\`\`\`javascript
(Add your solution code here)
\`\`\`
`;

      // Define the file path
      const fileName = `${problem.questionFrontendId}.md`;
      const filePath = path.join(difficultyDir, fileName);

      // Write to the markdown file
      fs.writeFileSync(filePath, markdownContent.trim());

      console.log(`Markdown file "${fileName}" has been created successfully in "${difficultyDir}"!`);
    } else {
      console.log('Problem not found.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Prompt the user for the LeetCode problem URL
const url = readlineSync.question('Please input the URL for your LeetCode problem: ');
fetchLeetCodeDetails(url);
