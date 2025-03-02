# Folder Structure Generator CLI 🚀

A simple CLI tool to generate directory and file structures based on a JSON configuration.

## 📌 Features
- ✅ **Create Nested Folders & Files** – Generates directories and files recursively.
- ✅ **Pre-Filled File Content** – Populate files with predefined content from JSON.
- ✅ **Easy to Use** - Just provide a JSON structure, and it will scaffold everything.
- ✅ **Cross-Platform** – Works on Windows, macOS, and Linux.

## 🔧 Installation
### 1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/folder-generator-cli.git
   cd folder-generator-cli
   ```   
### 2. Install dependencies:

``` sh
npm install
```      

### 3. Link CLI Globally (Optional)
To use it globally:

``` sh
npm link
```

## 🚀 Usage
### 1. Create a JSON Structure File
Define the directory and file structure in a structure.json file.

Example structure.json

```json
{
  "my-project": {
    "src": {
      "components": {
        "Button.tsx": "// Reusable Button component",
        "Navbar.tsx": "// Navigation Bar component"
      },
      "pages": {
        "Home.tsx": "// Home Page Component",
        "About.tsx": "// About Page Component"
      }
    },
    "public": {
      "index.html": "<!-- Main HTML file -->"
    },
    "README.md": "# My Project Documentation",
    ".gitignore": "node_modules/\ndist/\n.env"
  }
}
```
### 2. Run the CLI
If using locally:
```sh
node gen-struct.js structure.json
```

## ⚙️ How It Works
- Reads the JSON file and interprets the nested structure.
- Creates folders and files accordingly.
- If a file has content in JSON, it writes that content into the file.
- Ignores existing files unless manually deleted.

## 📂 Example Output Structure
After running the command, the following structure is created:
``` css
my-project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Navbar.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── About.tsx
├── public/
│   └── index.html
├── README.md
└── .gitignore

```

## 🎯 Use Cases
- Project Scaffolding – Quickly set up new projects.
- Boilerplate Generation – Define and reuse standard structures.
- Automation – Use it in CI/CD pipelines.

## 🛠 Customization
- Modify the structure.json file to fit your needs.
- Add templates for specific frameworks (React, Next.js, Express, etc.).