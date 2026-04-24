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

// Leaderboard endpoint
app.get('/api/github/leaderboard', async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com/search/users?q=followers:>10000&sort=followers&order=desc&per_page=15', { headers: githubHeaders });
    const users = response.data.items;
    const leaderboard = [];
    for (const user of users) {
      try {
        const userDetails = await axios.get(`https://api.github.com/users/${user.login}`, { headers: githubHeaders });
        leaderboard.push({
          rank: 0,
          login: user.login,
          avatar_url: user.avatar_url,
          followers: userDetails.data.followers,
          public_repos: userDetails.data.public_repos,
          score: Math.min(100, Math.floor(userDetails.data.followers / 1000) + Math.min(20, userDetails.data.public_repos))
        });
      } catch(e) { continue; }
    }
    leaderboard.sort((a,b) => b.score - a.score);
    leaderboard.forEach((u, i) => u.rank = i + 1);
    res.json(leaderboard.slice(0, 15));
  } catch (error) {
    console.error('Leaderboard error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Trending endpoint
app.get('/api/github/trending', async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com/search/users?q=followers:>1000&sort=followers&order=desc&per_page=20', { headers: githubHeaders });
    const users = response.data.items;
    const trending = [];
    for (const user of users) {
      try {
        const userDetails = await axios.get(`https://api.github.com/users/${user.login}`, { headers: githubHeaders });
        trending.push({
          login: user.login,
          avatar_url: user.avatar_url,
          name: userDetails.data.name || user.login,
          followers: userDetails.data.followers,
          public_repos: userDetails.data.public_repos
        });
      } catch(e) { continue; }
    }
    res.json(trending);
  } catch (error) {
    console.error('Trending error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Weekly commit history endpoint
app.get('/api/github/commit-history/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const eventsRes = await axios.get(`https://api.github.com/users/${username}/events?per_page=100`, { headers: githubHeaders });
    const events = eventsRes.data;
    const weeklyCommits = new Map();
    events.forEach(event => {
      if (event.type === 'PushEvent') {
        const date = new Date(event.created_at);
        const year = date.getFullYear();
        const weekNum = Math.ceil((date - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
        const weekKey = `${year}-W${weekNum}`;
        weeklyCommits.set(weekKey, (weeklyCommits.get(weekKey) || 0) + (event.payload.commits?.length || 0));
      }
    });
    const sorted = Array.from(weeklyCommits.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-24);
    res.json(sorted);
  } catch (error) {
    console.error('Commit history error:', error.message);
    res.json([]);
  }
});

// Translation endpoint
app.post('/api/github/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing text or targetLang' });
  }
  try {
    const prompt = `Translate the following text to ${targetLang}. Respond with ONLY the translated text, no explanations or quotes:\n\n${text}`;
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
    });
    const translated = completion.choices[0]?.message?.content || text;
    res.json({ translated: translated.trim() });
  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Personal AI Coach - learning resources based on low scores
app.get('/api/github/coach/:username', async (req, res) => {
  const { username } = req.params;
  try {
    // First get the user's analysis with scores
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, { headers: githubHeaders });
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, { headers: githubHeaders });
    const repos = reposResponse.data;
    const eventsRes = await axios.get(`https://api.github.com/users/${username}/events?per_page=100`, { headers: githubHeaders });
    const events = eventsRes.data;
    
    let totalCommits = 0;
    events.forEach(event => {
      if (event.type === 'PushEvent') totalCommits += event.payload.commits?.length || 0;
    });
    
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
    
    let collab = Math.min(10, Math.floor(2 + (userResponse.data.followers / 10) + (userResponse.data.following / 10)));
    collab = Math.min(10, Math.max(1, collab));
    
    const scores = { problemSolving, codeQuality, consistency, collaboration: collab };
    
    // Find lowest score
    const sorted = Object.entries(scores).sort((a,b) => a[1] - b[1]);
    const lowest = sorted[0];
    const lowestScore = lowest[1];
    const lowestCategory = lowest[0];
    
    // Category mappings for search
    const categoryMap = {
      problemSolving: 'algorithm challenges data structures',
      codeQuality: 'clean code best practices testing',
      consistency: 'daily coding habits productivity',
      collaboration: 'open source contributions git workflow'
    };
    
    const searchQuery = categoryMap[lowestCategory] || 'coding tutorial';
    
    // Search GitHub for learning resources
    const searchRes = await axios.get(`https://api.github.com/search/repositories?q=${searchQuery}+stars:>100&sort=stars&order=desc&per_page=5`, { headers: githubHeaders });
    
    const resources = searchRes.data.items.map(repo => ({
      name: repo.name,
      description: repo.description || 'No description',
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language
    }));
    
    // Generate AI advice
    const advicePrompt = `A developer has a ${lowestCategory} score of ${lowestScore}/10. Provide 2-3 short, practical tips to improve this skill. Keep response under 200 characters.`;
    const adviceCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: advicePrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    });
    const advice = adviceCompletion.choices[0]?.message?.content || "Practice regularly and review best practices.";
    
    res.json({
      lowestCategory: lowestCategory,
      lowestScore: lowestScore,
      advice: advice,
      resources: resources
    });
  } catch (error) {
    console.error('Coach error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Personal AI Coach - learning resources based on low scores
app.get('/api/github/coach/:username', async (req, res) => {
  const { username } = req.params;
  try {
    // First get the user's analysis with scores
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, { headers: githubHeaders });
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, { headers: githubHeaders });
    const repos = reposResponse.data;
    const eventsRes = await axios.get(`https://api.github.com/users/${username}/events?per_page=100`, { headers: githubHeaders });
    const events = eventsRes.data;
    
    let totalCommits = 0;
    events.forEach(event => {
      if (event.type === 'PushEvent') totalCommits += event.payload.commits?.length || 0;
    });
    
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
    
    let collab = Math.min(10, Math.floor(2 + (userResponse.data.followers / 10) + (userResponse.data.following / 10)));
    collab = Math.min(10, Math.max(1, collab));
    
    const scores = { problemSolving, codeQuality, consistency, collaboration: collab };
    
    // Find lowest score
    const sorted = Object.entries(scores).sort((a,b) => a[1] - b[1]);
    const lowest = sorted[0];
    const lowestScore = lowest[1];
    const lowestCategory = lowest[0];
    
    // Category mappings for search
    const categoryMap = {
      problemSolving: 'algorithm challenges data structures',
      codeQuality: 'clean code best practices testing',
      consistency: 'daily coding habits productivity',
      collaboration: 'open source contributions git workflow'
    };
    
    const searchQuery = categoryMap[lowestCategory] || 'coding tutorial';
    
    // Search GitHub for learning resources
    const searchRes = await axios.get(`https://api.github.com/search/repositories?q=${searchQuery}+stars:>100&sort=stars&order=desc&per_page=5`, { headers: githubHeaders });
    
    const resources = searchRes.data.items.map(repo => ({
      name: repo.name,
      description: repo.description || 'No description',
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language
    }));
    
    // Generate AI advice
    const advicePrompt = `A developer has a ${lowestCategory} score of ${lowestScore}/10. Provide 2-3 short, practical tips to improve this skill. Keep response under 200 characters.`;
    const adviceCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: advicePrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    });
    const advice = adviceCompletion.choices[0]?.message?.content || "Practice regularly and review best practices.";
    
    res.json({
      lowestCategory: lowestCategory,
      lowestScore: lowestScore,
      advice: advice,
      resources: resources
    });
  } catch (error) {
    console.error('Coach error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Personal AI Coach - learning resources based on low scores
app.get('/api/github/coach/:username', async (req, res) => {
  const { username } = req.params;
  try {
    // First get the user's analysis with scores
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, { headers: githubHeaders });
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, { headers: githubHeaders });
    const repos = reposResponse.data;
    const eventsRes = await axios.get(`https://api.github.com/users/${username}/events?per_page=100`, { headers: githubHeaders });
    const events = eventsRes.data;
    
    let totalCommits = 0;
    events.forEach(event => {
      if (event.type === 'PushEvent') totalCommits += event.payload.commits?.length || 0;
    });
    
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
    
    let collab = Math.min(10, Math.floor(2 + (userResponse.data.followers / 10) + (userResponse.data.following / 10)));
    collab = Math.min(10, Math.max(1, collab));
    
    const scores = { problemSolving, codeQuality, consistency, collaboration: collab };
    
    // Find lowest score
    const sorted = Object.entries(scores).sort((a,b) => a[1] - b[1]);
    const lowest = sorted[0];
    const lowestScore = lowest[1];
    const lowestCategory = lowest[0];
    
    // Category mappings for search
    const categoryMap = {
      problemSolving: 'algorithm challenges data structures',
      codeQuality: 'clean code best practices testing',
      consistency: 'daily coding habits productivity',
      collaboration: 'open source contributions git workflow'
    };
    
    const searchQuery = categoryMap[lowestCategory] || 'coding tutorial';
    
    // Search GitHub for learning resources
    const searchRes = await axios.get(`https://api.github.com/search/repositories?q=${searchQuery}+stars:>100&sort=stars&order=desc&per_page=5`, { headers: githubHeaders });
    
    const resources = searchRes.data.items.map(repo => ({
      name: repo.name,
      description: repo.description || 'No description',
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language
    }));
    
    // Generate AI advice
    const advicePrompt = `A developer has a ${lowestCategory} score of ${lowestScore}/10. Provide 2-3 short, practical tips to improve this skill. Keep response under 200 characters.`;
    const adviceCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: advicePrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    });
    const advice = adviceCompletion.choices[0]?.message?.content || "Practice regularly and review best practices.";
    
    res.json({
      lowestCategory: lowestCategory,
      lowestScore: lowestScore,
      advice: advice,
      resources: resources
    });
  } catch (error) {
    console.error('Coach error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
