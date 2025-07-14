import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

interface PendingToken {
  user: string;
  token_type: number;
  count: number;
}

const pendingTokens: PendingToken[] = [];

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
