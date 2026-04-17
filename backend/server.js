const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Groq = require('groq-sdk');
require('dotenv').config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GITHUB_TOKEN || !GROQ_API_KEY) {
  console.error("Missing GITHUB_TOKEN or GROQ_API_KEY in .env");
  process.exit(1);
}
const githubHeaders = { Authorization: `token ${GITHUB_TOKEN}` };
const groq = new Groq({ apiKey: GROQ_API_KEY });

setInterval(() => {}, 1000);

function computeScores(userData, repos, totalCommits) {
  const languageCount = new Set(repos.map(r => r.language).filter(Boolean)).size;
  let problemSolving = Math.min(10, Math.floor(3 + (repos.length / 10) + (languageCount / 2) + (totalCommits / 100)));
  problemSolving = Math.min(10, Math.max(1, problemSolving));
  let quality = 5;
  const hasReadme = repos.some(r => r.description && r.description.length > 10);
  const hasLicense = repos.some(r => r.license);
  if (hasReadme) quality += 2;
  if (hasLicense) quality += 2;
  if (repos.length > 5) quality += 1;
  let codeQuality = Math.min(10, quality);
  let consistency = Math.min(10, Math.floor(3 + (totalCommits / 50) + (repos.length / 5)));
  consistency = Math.min(10, Math.max(1, consistency));
  let collab = Math.min(10, Math.floor(2 + (userData.followers / 10) + (userData.following / 10)));
  collab = Math.min(10, Math.max(1, collab));
  return { problemSolving, codeQuality, consistency, collaboration: collab };
}

function getRecommendations(scores, topLanguages) {
  const recs = [];
  if (scores.codeQuality < 7) recs.push("Improve code quality: add README files, licenses, and comments.");
  if (scores.consistency < 6) recs.push("Increase consistency: commit more regularly and maintain activity.");
  if (scores.collaboration < 5) recs.push("Boost collaboration: contribute to others' projects and engage with the community.");
  if (topLanguages.join('').includes("HTML") && !topLanguages.join('').includes("JavaScript")) recs.push("Expand your skills: learn JavaScript and a modern framework like React.");
  if (scores.problemSolving < 6) recs.push("Work on more diverse projects to improve problem-solving.");
  if (recs.length < 2) recs.push("Write more tests and documentation to elevate project professionalism.");
  return recs.slice(0, 3);
}

app.get('/api/github/user/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const response = await axios.get(`https://api.github.com/users/${username}`, { headers: githubHeaders });
    res.json({
      login: response.data.login,
      name: response.data.name || response.data.login,
      avatar_url: response.data.avatar_url,
      public_repos: response.data.public_repos,
      followers: response.data.followers,
      following: response.data.following,
      bio: response.data.bio,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const msg = error.response?.data?.message || error.message;
    res.status(status).json({ error: msg });
  }
});

app.get('/api/github/languages/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const reposRes = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, { headers: githubHeaders });
    const langMap = new Map();
    for (const repo of reposRes.data) {
      if (repo.language) langMap.set(repo.language, (langMap.get(repo.language) || 0) + 1);
    }
    const languages = Array.from(langMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0,6);
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/github/contributions/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const eventsRes = await axios.get(`https://api.github.com/users/${username}/events?per_page=100`, { headers: githubHeaders });
    const events = eventsRes.data;
    const contributions = new Map();
    events.forEach(event => {
      if (event.type === "PushEvent") {
        const date = event.created_at.split("T")[0];
        contributions.set(date, (contributions.get(date) || 0) + (event.payload.commits?.length || 0));
      }
    });
    const heatmapData = Array.from(contributions.entries()).map(([date, count]) => ({ date, count }));
    res.json(heatmapData);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/github/analyze/:username', async (req, res) => {
  const { username } = req.params;
  console.log(`[AI] Analyzing ${username}`);
  try {
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, { headers: githubHeaders });
    const userData = userResponse.data;
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers: githubHeaders });
    const repos = reposResponse.data;
    const repoLanguages = repos.map(repo => repo.language).filter(lang => lang);
    const languageCounts = repoLanguages.reduce((acc, lang) => {
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
    const topLanguages = Object.entries(languageCounts)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => `${lang} (${count} repos)`);
    const eventsRes = await axios.get(`https://api.github.com/users/${username}/events?per_page=100`, { headers: githubHeaders });
    const events = eventsRes.data;
    let totalCommits = 0;
    events.forEach(event => {
      if (event.type === 'PushEvent') totalCommits += event.payload.commits?.length || 0;
    });

    const fallbackScores = computeScores(userData, repos, totalCommits);
    const fallbackRecs = getRecommendations(fallbackScores, topLanguages);

    let summary = "";
    try {
      const prompt = `You are an expert developer. Write a 2-3 sentence summary of this GitHub user's skills and strengths. Respond with ONLY the summary text, no extra words.

Username: ${userData.login}
Public Repos: ${userData.public_repos}
Total commits (approx): ${totalCommits}
Followers: ${userData.followers}
Top Languages: ${topLanguages.join(', ')}`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
      });
      summary = chatCompletion.choices[0]?.message?.content || "";
      summary = summary.replace(/```/g, '').trim();
    } catch (err) {
      console.error("AI summary failed:", err.message);
      summary = `${userData.login} is a developer with ${userData.public_repos} public repositories, focusing on ${topLanguages.slice(0,2).join(', ')}. Keep building and sharing!`;
    }

    const analysis = {
      summary: summary,
      scores: fallbackScores,
      recommendations: fallbackRecs,
    };
    console.log('[AI] Success (with computed scores)');
    res.json(analysis);
  } catch (error) {
    console.error('[AI] CRITICAL ERROR:', error.message);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.get('/api/github/compare/:userA/:userB', async (req, res) => {
  const { userA, userB } = req.params;
  console.log(`[Compare] ${userA} vs ${userB}`);
  try {
    const [userAResp, userBResp] = await Promise.all([
      axios.get(`https://api.github.com/users/${userA}`, { headers: githubHeaders }),
      axios.get(`https://api.github.com/users/${userB}`, { headers: githubHeaders })
    ]);
    const userAData = userAResp.data;
    const userBData = userBResp.data;

    const [reposAResp, reposBResp] = await Promise.all([
      axios.get(`https://api.github.com/users/${userA}/repos?per_page=100`, { headers: githubHeaders }),
      axios.get(`https://api.github.com/users/${userB}/repos?per_page=100`, { headers: githubHeaders })
    ]);
    const reposA = reposAResp.data;
    const reposB = reposBResp.data;

    const computeStats = (user, repos) => {
      const repoLanguages = repos.map(r => r.language).filter(Boolean);
      const langCounts = repoLanguages.reduce((acc, lang) => {
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {});
      const topLangs = Object.entries(langCounts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3)
        .map(([lang]) => lang);
      const totalCommits = 0;
      const scores = computeScores(user, repos, totalCommits);
      return {
        login: user.login,
        name: user.name || user.login,
        avatar_url: user.avatar_url,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        topLanguages: topLangs,
        scores: scores,
        recommendations: getRecommendations(scores, topLangs)
      };
    };

    const statsA = computeStats(userAData, reposA);
    const statsB = computeStats(userBData, reposB);

    const prompt = `Compare the following two GitHub developers. Provide a concise, insightful comparison (3-4 sentences) focusing on their activity, skill areas, code quality, collaboration, and potential strengths/weaknesses.

Developer A: ${userA}
- Repos: ${statsA.public_repos}
- Followers: ${statsA.followers}
- Top Languages: ${statsA.topLanguages.join(', ')}
- Scores: Problem Solving=${statsA.scores.problemSolving}, Code Quality=${statsA.scores.codeQuality}, Consistency=${statsA.scores.consistency}, Collaboration=${statsA.scores.collaboration}

Developer B: ${userB}
- Repos: ${statsB.public_repos}
- Followers: ${statsB.followers}
- Top Languages: ${statsB.topLanguages.join(', ')}
- Scores: Problem Solving=${statsB.scores.problemSolving}, Code Quality=${statsB.scores.codeQuality}, Consistency=${statsB.scores.consistency}, Collaboration=${statsB.scores.collaboration}

Generate a short, balanced comparison.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    });
    const comparisonSummary = chatCompletion.choices[0]?.message?.content || "Could not generate comparison.";

    res.json({
      userA: statsA,
      userB: statsB,
      comparisonSummary: comparisonSummary
    });
  } catch (error) {
    console.error('[Compare] ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});