# github-profile-analyzer.git
its my 1st Ai project
Here's your **320‑character description** and a **professional README** for GitHub.

---



> AI‑powered GitHub Profile Analyzer. Get skill scores (0‑10), personalized recommendations, compare two developers, download PDF reports, and share comparisons via unique URLs. Built with React, Node.js, Groq AI, and Tailwind CSS. Free and open‑source.






```markdown
# 📊 GitHub Profile Analyzer (Hope Mak AI Tool)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-blue)](https://tailwindcss.com/)

An AI‑powered web app that analyzes any GitHub profile and provides:

- 📊 **Developer stats** (repos, followers, following, bio)
- 📈 **Top languages** pie chart
- 📅 **Activity heatmap** (recent commit activity)
- 🤖 **AI‑generated summary** of skills and strengths
- 🎯 **Skill scores** (0‑10): Problem Solving, Code Quality, Consistency, Collaboration
- 💡 **Personalized recommendations** to grow as a developer
- 👥 **Compare two developers** side‑by‑side with AI‑written comparison
- 🔗 **Shareable links** (e.g., `/compare/octocat/hopemak`)
- 📄 **PDF export** – download any analysis as a professional report

> **Live Demo:** [coming soon]  
> **Backend API:** Free Groq (Llama 3.3 70B) + GitHub REST API

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Profile Analyzer** | Enter a GitHub username → see stats, language chart, activity heatmap, AI summary, scores, recommendations |
| **Skill Scores** | Four dimensions (Problem Solving, Code Quality, Consistency, Collaboration) scored 0‑10 with progress bars |
| **Compare Developers** | Side‑by‑side comparison of two users, including an AI‑generated comparison paragraph |
| **Shareable Links** | Direct URL like `/compare/octocat/hopemak` automatically loads the comparison |
| **PDF Export** | One‑click download of the entire analysis (individual or comparison) as a styled PDF |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, React Router, Tailwind CSS, Recharts, html2canvas, jsPDF
- **Backend:** Node.js, Express, Groq SDK, Axios, dotenv
- **APIs:** GitHub REST API, Groq (Llama 3.3 70B – free tier)
- **Deployment:** Frontend → Vercel / Netlify, Backend → Render / Railway (optional)

---

## 📦 Installation & Local Setup

### Prerequisites

- Node.js (v18 or higher)
- Git
- A free [Groq API key](https://console.groq.com) (no credit card required)
- A GitHub personal access token (classic, no scopes needed) – [create here](https://github.com/settings/tokens)

### 1. Clone the repository

```bash
git clone https://github.com/hopemak/github-profile-analyzer.git
cd github-profile-analyzer
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
GITHUB_TOKEN=your_github_token_here
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend server:

```bash
node server.js
```

It will run on `http://127.0.0.1:5000`.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will open at `http://127.0.0.1:3000`.

> **Note:** The frontend is configured to call `http://127.0.0.1:5000`. Change the base URL in `src/App.js` and `src/pages/Compare.js` if your backend runs elsewhere.

---

## 🧪 Usage Examples

### Analyze a single profile

1. Go to the home page
2. Type a GitHub username (e.g., `octocat` or `hopemak`)
3. Click **Analyze**
4. Scroll down to see:
   - Profile card
   - Top languages pie chart
   - Activity heatmap
   - AI summary
   - Skill scores with bars
   - Recommendations
   - PDF download button

### Compare two developers

- Navigate to **Compare Developers** in the navbar
- Enter two usernames (e.g., `octocat` vs `hopemak`)
- Or use a shareable link: `http://127.0.0.1:3000/compare/octocat/hopemak`

### Export to PDF

On any analysis page (individual or compare), click the red **Download PDF Report** button.

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token (no scopes required, raises rate limit to 5000/hour) |
| `GROQ_API_KEY` | Your Groq API key from [console.groq.com](https://console.groq.com) (free tier) |

Never commit these keys. The `.env` file is already ignored.

---

## 📁 Project Structure

```
github-profile-analyzer/
├── backend/
│   ├── server.js          # Main Express server with all endpoints
│   ├── .env               # Secrets (ignored)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.js
│   │   │   ├── ProfileCard.js
│   │   │   ├── TopLanguages.js
│   │   │   ├── ActivityHeatmap.js
│   │   │   ├── AISummary.js
│   │   │   └── SkillScores.js
│   │   ├── pages/
│   │   │   └── Compare.js
│   │   ├── utils/
│   │   │   └── pdfExport.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)

---

## 👨‍💻 Author

**Hope Mak (Abdi Mekonin)**  
- GitHub: [@hopemak](https://github.com/hopemak)  
- LinkedIn: [Your LinkedIn URL]  
- Portfolio: [Your website]

---

## 🙏 Acknowledgements

- [GitHub REST API](https://docs.github.com/en/rest)
- [Groq](https://groq.com/) for the free and fast Llama 3.3 70B API
- [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Recharts](https://recharts.org/)
- [html2canvas](https://html2canvas.hertzen.com/) and [jsPDF](https://github.com/parallax/jsPDF) for PDF export

---

## ⭐ Show Your Support

If you find this project useful, please give it a star ⭐ on GitHub and share it with your network!
