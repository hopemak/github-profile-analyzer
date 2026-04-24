
// Weekly commit history (last 24 weeks / 6 months)
app.get('/api/github/commit-history/:username', async (req, res) => {
  const { username } = req.params;
  try {
    // We can't directly get weekly aggregates, so we fetch all events and group by week
    const eventsRes = await axios.get(`https://api.github.com/users/${username}/events?per_page=100`, { headers: githubHeaders });
    const events = eventsRes.data;
    const weeklyCommits = new Map(); // key: "YYYY-WW"
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
    // Convert to array sorted by week
    const sorted = Array.from(weeklyCommits.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a,b) => a.week.localeCompare(b.week))
      .slice(-24); // last 24 weeks
    res.json(sorted);
  } catch (error) {
    res.json([]);
  }
});
