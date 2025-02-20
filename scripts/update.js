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

// Step 2: Get the path to the README.md files in the root and book_sources/ directories
const rootReadmePath = path.join(__dirname, '..', 'README.md'); // Adjusted path
const bookSourcesReadmePath = path.join(__dirname, '..', 'book_sources', 'README.md'); // Adjusted path
const summaryFilePath = path.join(__dirname, '..', 'book_sources', 'SUMMARY.md'); // Adjusted path

// Helper function to extract the title and difficulty from the file content and path
function extractFileDetails(filePath) {
  const absolutePath = path.resolve(filePath); // Use absolute path internally
  const fileName = path.basename(absolutePath, '.md');

  let difficulty = '';
  if (absolutePath.includes('easy')) difficulty = 'easy';
  else if (absolutePath.includes('medium')) difficulty = 'medium';
  else if (absolutePath.includes('hard')) difficulty = 'hard';

  // Extract the title from the file content (first # heading)
  const fileContent = fs.readFileSync(absolutePath, 'utf8');
  const titleMatch = fileContent.match(/^#\s*(.*)$/m); // Match the first heading
  const title = titleMatch ? titleMatch[1] : 'Untitled'; // If no title is found, default to 'Untitled'

  return { title, difficulty, filePath: absolutePath };
}

// Helper function to insert a file path into an unordered list and sort by question number
function insertFilePathAndSort(fileDetails, fileContent) {
  const { title, difficulty, filePath } = fileDetails;
  const lines = fileContent.split('\n');
  const sectionIndex = lines.findIndex(line => line.includes('汇总（按题目序号排列）'));

  if (sectionIndex !== -1) {
    // Format: [Title (C)](D)
    const newFilePath = `- [${title}(${difficulty})](./${filePath})`; // Removed extra space before '-'

    // Find the starting point for the list items
    let listStartIndex = lines.findIndex((line, index) => index > sectionIndex && line.trim().startsWith('-'));
    if (listStartIndex === -1) {
      // If no list is found, we'll start from the next line after the section
      listStartIndex = sectionIndex + 1;
    }

    // Extract the list items
    const listEndIndex = lines.findIndex((line, index) => index > listStartIndex && line.trim() === '');
    const listItems = listEndIndex === -1 ? lines.slice(listStartIndex) : lines.slice(listStartIndex, listEndIndex);

    // Sort the list items based on the question number
    const sortedListItems = [...listItems, newFilePath].sort((a, b) => {
      const getQuestionNumber = (item) => parseInt(item.match(/\d+/)[0], 10); // Extract question number
      return getQuestionNumber(a) - getQuestionNumber(b); // Sort by question number
    });

    // Reconstruct the final content with the sorted list
    lines.splice(listStartIndex, listItems.length, ...sortedListItems);
    return lines.join('\n');
  }
  return fileContent;
}

// Step 3: Update the README.md file in the root directory
function updateReadme(filePath, fileDetails) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = insertFilePathAndSort(fileDetails, content);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
  } catch (error) {
    console.error('Error updating README file:', error);
  }
}

// Step 4: Update the SUMMARY.md file in book_sources/ directory
function updateSummary(newFilePath) {
  try {
    const content = fs.readFileSync(summaryFilePath, 'utf8');
    const lines = content.split('\n');

    // Determine the category (easy, medium, or hard) based on the file path
    const category = newFilePath.includes('easy') ? 'easy' : newFilePath.includes('medium') ? 'medium' : 'hard';

    // Find the start of the category section (easy, medium, or hard)
    const categoryIndex = lines.findIndex(line => line.trim().startsWith(`- [${category.charAt(0).toUpperCase() + category.slice(1)}]`));

    if (categoryIndex !== -1) {
      // Find the next category section (easy, medium, or hard), to determine where this category ends
      const nextCategoryIndex = lines.findIndex((line, index) => index > categoryIndex && (
        line.trim().startsWith('- [Easy]') ||
        line.trim().startsWith('- [Medium]') ||
        line.trim().startsWith('- [Hard]')
      ));
      const listEndIndex = nextCategoryIndex === -1 ? lines.length : nextCategoryIndex;

      // Extract the current list of items in the category
      const listItems = lines.slice(categoryIndex + 1, listEndIndex).filter(line => line.trim() !== '');

      // Create the new entry for the file to be inserted
      const { title, difficulty, filePath } = extractFileDetails(newFilePath);
      const relativeFilePath = path.relative(path.join(__dirname, '..', 'book_sources'), filePath);  // Adjusted relative path
      const newListItem = `  - [${title}(${difficulty})](./${relativeFilePath})`; // Added './' to the relative path

      // Insert the new file entry into the sorted list
      const sortedListItems = [...listItems, newListItem].sort((a, b) => {
        const getQuestionNumber = (item) => parseInt(item.match(/\d+/)[0], 10); // Extract question number
        return getQuestionNumber(a) - getQuestionNumber(b); // Sort by question number
      });

      // Reconstruct the section with the sorted list
      lines.splice(categoryIndex + 1, listItems.length, ...sortedListItems);

      // Save the updated content back to the file
      fs.writeFileSync(summaryFilePath, lines.join('\n'), 'utf8');
    }
  } catch (error) {
    console.error('Error updating SUMMARY file:', error);
  }
}

// Step 5: Update the book_sources/README.md file
function updateBookSourcesReadme(filePath, fileDetails) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = insertFilePathAndSort(fileDetails, content);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
  } catch (error) {
    console.error('Error updating book_sources README file:', error);
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
    const relativeFilePathForRoot = path.relative(path.join(__dirname, '..'), newFilePath); // Adjusted relative path
    const relativeFilePathForBookSources = path.relative(path.join(__dirname, '..', 'book_sources'), newFilePath);

    // Update README.md in the root directory
    updateReadme(rootReadmePath, { ...fileDetails, filePath: relativeFilePathForRoot });

    // Update README.md in the book_sources/ directory
    updateBookSourcesReadme(bookSourcesReadmePath, { ...fileDetails, filePath: relativeFilePathForBookSources });

    // Update SUMMARY.md in the book_sources/ directory using newFilePath
    updateSummary(newFilePath);
  });
}

// Execute the script
main();
