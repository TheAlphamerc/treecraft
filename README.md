# 🚀 **gen-struct & gen-tree**
A simple cli tool for Project Scaffolding & Directory Visualization.

### 📌 Features
- **gen-struct**: Project Scaffolding & Folder Structure Generator.A tool to generate folder structures from a JSON configuration.
  - ✅ **Project Scaffolding** – Quickly create project structures.
  - ✅ **Create Nested Folders & Files** – Generates directories and files recursively.
  - ✅ **Pre-Filled File Content** – Populate files with predefined content from JSON.

- **gen-tree**: Directory Structure Visualizer.A CLI tool to display a tree-like visualization of a given directory.
  - ✅ **Visualize Directory Structure** – Display folder structure in a tree-like format.
  - ✅ **Use .gitignore** – Flag to exclude files/folders listed in `.gitignore`.
  - ✅ **Custom Configuration** – Save exclusion rules to `.gentreerc` for future use.



## 🚀 **Installation**
### **1. Clone the Repository**
```sh
git clone https://github.com/TheAlphamerc/gen-struct.git
cd gen-struct
```

### **2. Install Dependencies**
```sh
npm install
```

### **3. Link CLI Globally (Optional)**
To use commands anywhere:
```sh
npm link
```

## 🏗️ **gen-struct Usage**
**1️⃣ Define a JSON Structure File**
Create `structure.json`:
```json
{
  "my-project": {
    "src": {
      "components": {
        "Button.tsx": "// Button component",
        "Navbar.tsx": "// Navbar component"
      },
      "pages": {
        "Home.tsx": "// Home Page",
        "About.tsx": "// About Page"
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

### **2️⃣ Run the Generator**
```sh
gen-struct structure.json
```

### ⚙️ How It Works
- Reads the JSON file and interprets the nested structure.
- Creates folders and files accordingly.
- If a file has content in JSON, it writes that content into the file.
- Ignores existing files unless manually deleted.

### 📂 Example Output Structure
After running the command, the following structure is created:
``` sh
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

### 🎯 Use Cases
- Project Scaffolding – Quickly set up new projects.
- consistent folder structure – Ensure a uniform project layout.
- Boilerplate Generation – Define and reuse standard structures.
- Automation – Use it in CI/CD pipelines.


## 🌳 **gen-tree Usage**
### **1️⃣ Basic Usage**
To generate a **tree-like directory structure**, run:
```sh
gen-tree /path/to/directory
```
If no path is given, it defaults to the **current directory**.

### **2️⃣ Exclude Folders via `.gentreerc`**
Create a `.gentreerc` file:
```json
{
  "exclude": ["node_modules", "build", "dist", ".git"]
}
```
Then run:
```sh
gen-tree
```
Excluded folders won't appear in the tree output.

### ⚙️ **Configuration Options**
| Flag | Description |
|------|-------------|
| `--gitignore` | Uses `.gitignore` to ignore files/folders |

---

### 🏆 **Examples**
### **📂 Sample Project Structure**
```
my-project/
├── src/
│   ├── components/
│   ├── pages/
├── dist/ ❌ (Excluded)
├── node_modules/ ❌ (Excluded)
├── .git/ ❌ (Excluded)
└── README.md
```

### **CLI Output**
```sh
gen-tree --gitignore
```
```
📁 Directory structure of: my-project

📂 src
│  ├── 📂 components
│  ├── 📂 pages
└── 📄 README.md
```
### 🎯 Use Cases
- ✅ **codebase exploration** – Understand the project structure at a glance.
- ✅ **dependency analysis** – Identify unused or redundant folders.
