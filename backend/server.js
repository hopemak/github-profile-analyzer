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
 
  // Fetch additional data
  const gistsRes = await axios.get(`https://api.github.com/users/${username}/gists?per_page=1`, { headers: githubHeaders });
  const gistCount = parseInt(gistsRes.headers.link?.match(/&page=(\d+)>/)?.[1] || 1);
  const issuesRes = await axios.get(`https://api.github.com/search/issues?q=author:${username}+type:issue`, { headers: githubHeaders });
  const issueCount = issuesRes.data.total_count;

Username: ${userData.login}
Public Repos: ${userData.public_repos}
nGists: ${gistCount}
Open Issues (authored): ${issueCount}
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
 
  // Fetch additional data
  const gistsRes = await axios.get(`https://api.github.com/users/${username}/gists?per_page=1`, { headers: githubHeaders });
  const gistCount = parseInt(gistsRes.headers.link?.match(/&page=(\d+)>/)?.[1] || 1);
  const issuesRes = await axios.get(`https://api.github.com/search/issues?q=author:${username}+type:issue`, { headers: githubHeaders });
  const issueCount = issuesRes.data.total_count;

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


// Weekly commit history (last 24 weeks)
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
        const commits = event.payload.commits?.length || 0;
        weeklyCommits.set(weekKey, (weeklyCommits.get(weekKey) || 0) + commits);
      }
    });
    const sorted = Array.from(weeklyCommits.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a,b) => a.week.localeCompare(b.week))
      .slice(-24);
    res.json(sorted);
  } catch (error) {
    console.error('Commit history error:', error.message);
    res.json([]);
  }
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});// Trending developers (top 10 by followers)
app.get('/api/github/trending', async (req, res) => {
  try {
    const query = 'followers:>1000';
    const response = await axios.get(`https://api.github.com/search/users?q=${query}&sort=followers&order=desc&per_page=10`, { headers: githubHeaders });
    const users = response.data.items;
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced trending developers with details
app.get('/api/github/trending/details', async (req, res) => {
  try {
    // Get top users by followers
    const searchRes = await axios.get('https://api.github.com/search/users?q=followers:>1000&sort=followers&order=desc&per_page=10', { headers: githubHeaders });
    const users = searchRes.data.items;
    
    // Fetch detailed info for each user in parallel
    const detailedUsers = await Promise.all(users.map(async (user) => {
      const userRes = await axios.get(`https://api.github.com/users/${user.login}`, { headers: githubHeaders });
      const reposRes = await axios.get(`https://api.github.com/users/${user.login}/repos?per_page=100&sort=stars&direction=desc`, { headers: githubHeaders });
      const totalStars = reposRes.data.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      return {
        login: userRes.data.login,
        name: userRes.data.name || userRes.data.login,
        avatar_url: userRes.data.avatar_url,
        public_repos: userRes.data.public_repos,
        followers: userRes.data.followers,
        following: userRes.data.following,
        totalStars: totalStars,
        html_url: userRes.data.html_url
      };
    }));
    res.json(detailedUsers);
  } catch (error) {
    console.error('Trending error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========== AUTHENTICATION ==========
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

app.use(cookieParser());
app.use(passport.initialize());

// MongoDB User Model
const UserSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatarUrl: String,
  favorites: [{ type: String }], // store GitHub usernames
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Connect to MongoDB (only if URI is provided)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));
}

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/github/callback`
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ githubId: profile.id });
  if (!user) {
    user = await User.create({
      githubId: profile.id,
      username: profile.username,
      avatarUrl: profile._json.avatar_url,
      favorites: []
    });
  }
  done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Auth endpoints
app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/api/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
  const token = jwt.sign({ id: req.user.id, username: req.user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?token=${token}`);
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.json(null);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(decoded.id).then(user => res.json(user));
  } catch { res.json(null); }
});

// Favorites endpoints
app.post('/api/favorites/:username', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user.favorites.includes(req.params.username)) {
    user.favorites.push(req.params.username);
    await user.save();
  }
  res.json(user.favorites);
});

app.delete('/api/favorites/:username', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  user.favorites = user.favorites.filter(u => u !== req.params.username);
  await user.save();
  res.json(user.favorites);
});

app.get('/api/favorites', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.json([]);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  res.json(user.favorites);
});

// ========== AUTHENTICATION ==========
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

app.use(cookieParser());
app.use(passport.initialize());

// MongoDB User Model
const UserSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatarUrl: String,
  favorites: [{ type: String }], // store GitHub usernames
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Connect to MongoDB (only if URI is provided)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));
}

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/github/callback`
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ githubId: profile.id });
  if (!user) {
    user = await User.create({
      githubId: profile.id,
      username: profile.username,
      avatarUrl: profile._json.avatar_url,
      favorites: []
    });
  }
  done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Auth endpoints
app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/api/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
  const token = jwt.sign({ id: req.user.id, username: req.user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?token=${token}`);
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.json(null);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(decoded.id).then(user => res.json(user));
  } catch { res.json(null); }
});

// Favorites endpoints
app.post('/api/favorites/:username', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user.favorites.includes(req.params.username)) {
    user.favorites.push(req.params.username);
    await user.save();
  }
  res.json(user.favorites);
});

app.delete('/api/favorites/:username', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  user.favorites = user.favorites.filter(u => u !== req.params.username);
  await user.save();
  res.json(user.favorites);
});

app.get('/api/favorites', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.json([]);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  res.json(user.favorites);
});

// Leaderboard: top developers by computed skill score
app.get('/api/github/leaderboard', async (req, res) => {
  try {
    // Fetch top users by followers (source for leaderboard candidates)
    const searchRes = await axios.get('https://api.github.com/search/users?q=followers:>5000&sort=followers&order=desc&per_page=20', { headers: githubHeaders });
    const users = searchRes.data.items;
    
    const leaderboard = await Promise.all(users.map(async (user) => {
      try {
        const details = await axios.get(`https://api.github.com/users/${user.login}`, { headers: githubHeaders });
        const reposRes = await axios.get(`https://api.github.com/users/${user.login}/repos?per_page=100`, { headers: githubHeaders });
        const repos = reposRes.data;
        
        // Calculate skill score components
        const languageCount = new Set(repos.map(r => r.language).filter(Boolean)).size;
        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const avgStars = repos.length ? totalStars / repos.length : 0;
        
        // Score formula (0-100)
        const followerScore = Math.min(50, Math.floor(details.data.followers / 1000) * 5);
        const repoScore = Math.min(20, repos.length);
        const langScore = Math.min(15, languageCount * 3);
        const starScore = Math.min(15, avgStars / 100);
        const totalScore = followerScore + repoScore + langScore + starScore;
        
        return {
          rank: 0,
          login: user.login,
          avatar_url: user.avatar_url,
          followers: details.data.followers,
          public_repos: repos.length,
          languages: languageCount,
          avgStars: Math.round(avgStars),
          score: totalScore
        };
      } catch (err) {
        return null;
      }
    }));
    
    const filtered = leaderboard.filter(u => u !== null);
    filtered.sort((a,b) => b.score - a.score);
    filtered.forEach((user, idx) => user.rank = idx + 1);
    res.json(filtered.slice(0, 15));
  } catch (error) {
    console.error('Leaderboard error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard: top developers by computed skill score
app.get('/api/github/leaderboard', async (req, res) => {
  try {
    const searchRes = await axios.get('https://api.github.com/search/users?q=followers:>10000&sort=followers&order=desc&per_page=15', { headers: githubHeaders });
    const users = searchRes.data.items;
    const leaderboard = [];
    for (const user of users) {
      try {
        const details = await axios.get(`https://api.github.com/users/${user.login}`, { headers: githubHeaders });
        const reposRes = await axios.get(`https://api.github.com/users/${user.login}/repos?per_page=100`, { headers: githubHeaders });
        const repos = reposRes.data;
        const languageCount = new Set(repos.map(r => r.language).filter(Boolean)).size;
        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const avgStars = repos.length ? totalStars / repos.length : 0;
        const followerScore = Math.min(50, Math.floor(details.data.followers / 500));
        const repoScore = Math.min(20, repos.length);
        const langScore = Math.min(15, languageCount * 3);
        const starScore = Math.min(15, avgStars / 100);
        const totalScore = Math.round(followerScore + repoScore + langScore + starScore);
        leaderboard.push({
          rank: 0,
          login: user.login,
          avatar_url: user.avatar_url,
          followers: details.data.followers,
          public_repos: repos.length,
          languages: languageCount,
          avgStars: Math.round(avgStars),
          score: Math.min(100, totalScore)
        });
      } catch (err) {
        console.error(`Error fetching ${user.login}:`, err.message);
      }
    }
    leaderboard.sort((a,b) => b.score - a.score);
    leaderboard.forEach((user, idx) => user.rank = idx + 1);
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
