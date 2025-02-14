const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Step 1: Get untracked files in the book_sources/easy, book_sources/medium, and book_sources/hard directories
function getUntrackedFiles() {
  try {
    const result = execSync('git status --porcelain').toString();
    const untrackedFiles = result
      .split('\n')
      .filter(line => line.startsWith('??'))
      .map(line => line.slice(3).trim())
      .filter(file => {
        // Only include files within the book_sources/easy, book_sources/medium, and book_sources/hard directories
        return file.startsWith('book_sources/easy') || file.startsWith('book_sources/medium') || file.startsWith('book_sources/hard');
      });
    return untrackedFiles;
  } catch (error) {
    console.error('Error getting untracked files:', error);
    return [];
  }
}

// Step 2: Get the path to the README.md in the root and book_sources/ directories
const rootReadmePath = path.join(__dirname, 'README.md');
const bookSourcesReadmePath = path.join(__dirname, 'book_sources', 'README.md');
const summaryFilePath = path.join(__dirname, 'book_sources', 'SUMMARY.md');

// Helper function to extract the question number, title, and difficulty from the file path and content
function extractFileDetails(filePath) {
  const fileName = path.basename(filePath, '.md');
  const parts = fileName.split(' '); // Assuming the file is named in the format: "123 Title.md"
  const questionNumber = parts[0]; // First part is the question number

  let difficulty = '';
  if (filePath.includes('easy')) difficulty = 'easy';
  else if (filePath.includes('medium')) difficulty = 'medium';
  else if (filePath.includes('hard')) difficulty = 'hard';

  // Extract the title from the file content (first # heading)
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const titleMatch = fileContent.match(/^#\s*(.*)$/m); // Match the first heading
  const title = titleMatch ? titleMatch[1] : 'Untitled'; // If no title is found, default to 'Untitled'

  return { questionNumber, title, difficulty, filePath };
}

// Helper function to insert a file path into an unordered list and sort by question number
function insertFilePathAndSort(fileDetails, fileContent) {
  const { questionNumber, title, difficulty, filePath } = fileDetails;
  const lines = fileContent.split('\n');
  const sectionIndex = lines.findIndex(line => line.includes('汇总（按题目序号排列）'));

  if (sectionIndex !== -1) {
    // Format: [A. B(C)](D)
    const newFilePath = `  - [${questionNumber}. ${title}(${difficulty})](${filePath})`;

    // Insert the new file path
    let insertIndex = lines.findIndex((line, index) => index > sectionIndex && line.trim() === '');
    if (insertIndex === -1) insertIndex = lines.length; // Append at the end if no blank line is found

    lines.splice(insertIndex, 0, newFilePath);

    // Sort the list of files by question number
    const listStartIndex = lines.findIndex(line => line.includes('汇总（按题目序号排列）')) + 1;
    const listEndIndex = lines.findIndex((line, index) => index > listStartIndex && line.trim() === '');
    const listItems = lines.slice(listStartIndex, listEndIndex);

    // Sort the list items by question number
    listItems.sort((a, b) => {
      const getQuestionNumber = (item) => parseInt(item.match(/\d+/)[0], 10); // Extract question number
      return getQuestionNumber(a) - getQuestionNumber(b);
    });

    // Reconstruct the final content
    lines.splice(listStartIndex, listItems.length, ...listItems);
    return lines.join('\n');
  }
  return fileContent;
}

// Step 3: Update the README.md files
function updateReadme(filePath, fileDetails) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = insertFilePathAndSort(fileDetails, content);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
  } catch (error) {
    console.error('Error updating README file:', error);
  }
}

// Step 4: Update the SUMMARY.md file
function updateSummary(newFilePath) {
  try {
    const content = fs.readFileSync(summaryFilePath, 'utf8');
    const lines = content.split('\n');

    // Find the corresponding category (easy, medium, hard)
    const category = newFilePath.includes('easy') ? 'easy' : newFilePath.includes('medium') ? 'medium' : 'hard';
    const categoryIndex = lines.findIndex(line => line.includes(category));

    if (categoryIndex !== -1) {
      const insertIndex = lines.findIndex((line, index) => index > categoryIndex && line.trim() === '');
      const newListItem = `    - [${path.basename(newFilePath)}](${newFilePath})`;

      if (insertIndex !== -1) {
        lines.splice(insertIndex, 0, newListItem);
      } else {
        lines.push(newListItem);  // Append to the end if no blank line is found
      }

      // Save the updated content back to the file
      fs.writeFileSync(summaryFilePath, lines.join('\n'), 'utf8');
    }
  } catch (error) {
    console.error('Error updating SUMMARY file:', error);
  }
}

// Main function to execute the automation
function main() {
  const untrackedFiles = getUntrackedFiles();
  if (untrackedFiles.length === 0) {
    console.log('No untracked files found.');
    return;
  }

  // Process each untracked file
  untrackedFiles.forEach(file => {
    const newFilePath = file.trim();
    const fileDetails = extractFileDetails(newFilePath);
    const relativeFilePathForRoot = path.relative(__dirname, newFilePath);
    const relativeFilePathForBookSources = path.relative(path.join(__dirname, 'book_sources'), newFilePath);

    // Update README.md in the root directory
    updateReadme(rootReadmePath, { ...fileDetails, filePath: relativeFilePathForRoot });

    // Update README.md in the book_sources/ directory
    updateReadme(bookSourcesReadmePath, { ...fileDetails, filePath: relativeFilePathForBookSources });

    // Update SUMMARY.md in the book_sources/ directory
    updateSummary(relativeFilePathForBookSources);
  });
}

// Execute the script
main();
