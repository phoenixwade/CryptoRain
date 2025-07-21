import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['https://cryptokaraoke.io', 'https://www.cryptokaraoke.io', 'http://localhost:8080'],
  credentials: true
}));

interface PendingToken {
  user: string;
  token_type: number;
  count: number;
}

interface LeaderboardEntry {
  user: string;
  score: number;
  timestamp: number;
}

const pendingTokens: PendingToken[] = [];
const leaderboard: LeaderboardEntry[] = [];

app.get('/leaderboard', async (req, res) => {
  try {
    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    console.log('Fetching leaderboard:', sortedLeaderboard);
    res.json(sortedLeaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).send('Server error');
  }
});

app.post('/submit-score', async (req, res) => {
  const { user, score } = req.body;
  if (!user || typeof score !== 'number' || score < 0) {
    return res.status(400).send('Invalid user or score');
  }
  
  try {
    const newEntry: LeaderboardEntry = {
      user,
      score,
      timestamp: Date.now()
    };
    
    leaderboard.push(newEntry);
    
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > 10) {
      leaderboard.splice(10);
    }
    
    console.log(`Score submitted: ${user} - ${score}`);
    res.json({ success: true, rank: leaderboard.findIndex(entry => entry.user === user && entry.score === score) + 1 });
  } catch (err) {
    console.error('Error submitting score:', err);
    res.status(500).send('Server error');
  }
});

app.post('/collect', async (req, res) => {
  const { user, token_type } = req.body;
  if (!user || token_type < 1 || token_type > 15) return res.status(400).send('Invalid');
  
  try {
    const existingToken = pendingTokens.find(t => t.user === user && t.token_type === token_type);
    
    if (existingToken) {
      existingToken.count += 1;
    } else {
      pendingTokens.push({ user, token_type, count: 1 });
    }
    
    console.log(`Collected token ${token_type} for user ${user}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error collecting token:', err);
    res.status(500).send('Server error');
  }
});

app.get('/pending/:user', async (req, res) => {
  try {
    const userTokens = pendingTokens.filter(t => t.user === req.params.user);
    console.log(`Fetching pending tokens for user ${req.params.user}:`, userTokens);
    res.json({ tokens: userTokens });
  } catch (err) {
    console.error('Error fetching pending tokens:', err);
    res.status(500).send('Server error');
  }
});

app.post('/clear', async (req, res) => {
  const { user } = req.body;
  try {
    const initialLength = pendingTokens.length;
    for (let i = pendingTokens.length - 1; i >= 0; i--) {
      if (pendingTokens[i].user === user) {
        pendingTokens.splice(i, 1);
      }
    }
    console.log(`Cleared ${initialLength - pendingTokens.length} tokens for user ${user}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error clearing tokens:', err);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
