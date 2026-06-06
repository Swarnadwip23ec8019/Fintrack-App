const fs = require('fs');
let content = fs.readFileSync('src/ui.js', 'utf8');

// Replace Edit Button Emoji
content = content.replace(
  /editBtn\.setAttribute\('aria-label', 'Edit transaction'\);\r?\n\s*editBtn\.textContent = '.*?';/,
  "editBtn.setAttribute('aria-label', 'Edit transaction');\n  editBtn.innerHTML = '<i data-lucide=\"pencil\" style=\"width: 14px; height: 14px;\"></i>';"
);

// Replace Delete Button Emoji
content = content.replace(
  /deleteBtn\.setAttribute\('aria-label', 'Delete transaction'\);\r?\n\s*deleteBtn\.textContent = '.*?';/,
  "deleteBtn.setAttribute('aria-label', 'Delete transaction');\n  deleteBtn.innerHTML = '<i data-lucide=\"trash-2\" style=\"width: 14px; height: 14px;\"></i>';"
);

fs.writeFileSync('src/ui.js', content, 'utf8');
console.log("Replaced successfully!");
