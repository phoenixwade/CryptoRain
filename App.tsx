import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  TouchableOpacity, 
  Alert, 
  ImageBackground,
  StatusBar,
  PanResponder
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_URL = 'http://localhost:3000'; // Backend server URL
const CITIES = ['NewYork', 'Tokyo', 'London', 'Paris', 'Berlin', 'Sydney', 'RioDeJaneiro', 'Dubai', 'Shanghai', 'Toronto'];

const TOKENS = Array.from({length: 15}, (_, i) => ({
  id: i+1,
  name: `Token${i+1}`,
  color: `hsl(${i*24}, 80%, 50%)`,
  weight: i < 10 ? 50 : i < 13 ? 20 : 5, // Common: 50, Rare: 20, Epic: 5
}));

const pickTokenType = () => {
  const total = TOKENS.reduce((sum, t) => sum + t.weight, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < TOKENS.length; i++) {
    rand -= TOKENS[i].weight;
    if (rand <= 0) return i+1;
  }
  return 1;
};

interface FallingToken { 
  id: string; 
  type: number; 
  x: number; 
  y: Animated.Value; 
  speed: number;
  animatedValue: Animated.CompositeAnimation;
}

const App = () => {
  const [user, setUser] = useState<string | null>('testuser'); // Mock user for development
  const [tokens, setTokens] = useState<FallingToken[]>([]);
  const [level, setLevel] = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [collectedThisLevel, setCollectedThisLevel] = useState(0);
  const [levelStartTime, setLevelStartTime] = useState(0);
  const [score, setScore] = useState(0);
  const nextId = useRef(0);
  const spawnInterval = useRef<NodeJS.Timeout | null>(null);

  const mockProtonSDK = {
    init: () => Promise.resolve(),
    login: () => Promise.resolve({ actor: 'testuser' }),
    transact: () => Promise.resolve()
  };

  useEffect(() => {
    mockProtonSDK.init();
  }, []);

  const login = async () => {
    try {
      const { actor } = await mockProtonSDK.login();
      setUser(actor);
      Alert.alert('Login Successful', `Welcome ${actor}!`);
    } catch (err: any) { 
      Alert.alert('Login Error', err.message); 
    }
  };

  const startGame = async () => {
    if (!user) return Alert.alert('Please login first');
    try {
      await mockProtonSDK.transact();
      
      setLevel(1); 
      setSpeedMultiplier(1); 
      setIsPlaying(true); 
      setGameOver(false); 
      setTokens([]); 
      setCollectedThisLevel(0); 
      setLevelStartTime(Date.now());
      setScore(0);
    } catch (err: any) { 
      Alert.alert('Start Error', err.message); 
    }
  };

  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (spawnInterval.current) {
        clearInterval(spawnInterval.current);
        spawnInterval.current = null;
      }
      return;
    }

    spawnInterval.current = setInterval(() => {
      const type = pickTokenType();
      const x = Math.random() * (SCREEN_WIDTH - 60);
      const speed = (Math.random() * 1 + 2) * speedMultiplier;
      const y = new Animated.Value(-60);

      const animatedValue = Animated.timing(y, { 
        toValue: SCREEN_HEIGHT + 60, 
        duration: (SCREEN_HEIGHT + 120) / speed * 1000, 
        useNativeDriver: true 
      });

      const token: FallingToken = { 
        id: `${nextId.current++}`, 
        type, 
        x, 
        y,
        speed,
        animatedValue
      };

      setTokens(prev => [...prev, token]);

      animatedValue.start(({ finished }) => {
        if (finished) {
          setTokens(prev => prev.filter(t => t.id !== token.id));
          setGameOver(true); 
          setIsPlaying(false);
        }
      });
    }, Math.max(400, 1000 - (level * 50))); // Faster spawn per level

    return () => {
      if (spawnInterval.current) {
        clearInterval(spawnInterval.current);
      }
    };
  }, [isPlaying, gameOver, speedMultiplier, level]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    
    const checkProgress = setInterval(() => {
      if (collectedThisLevel >= 10 || (Date.now() - levelStartTime > 30000)) {
        if (level < 10) {
          setLevel(prev => prev + 1);
          setSpeedMultiplier(prev => prev + 0.5);
          setCollectedThisLevel(0);
          setLevelStartTime(Date.now());
          Alert.alert('Level Up!', `Welcome to Level ${level + 1} - ${CITIES[level]}!`);
        }
      }
    }, 1000);
    
    return () => clearInterval(checkProgress);
  }, [isPlaying, level, collectedThisLevel, levelStartTime, gameOver]);

  const collectToken = async (tokenId: string, tokenType: number) => {
    try {
      await fetch(`${API_URL}/collect`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ user, token_type: tokenType }) 
      });
      
      setCollectedThisLevel(prev => prev + 1);
      setScore(prev => prev + (tokenType > 13 ? 100 : tokenType > 10 ? 50 : 10)); // Epic: 100, Rare: 50, Common: 10
      
      setTokens(prev => {
        const tokenToRemove = prev.find(t => t.id === tokenId);
        if (tokenToRemove) {
          tokenToRemove.animatedValue.stop();
        }
        return prev.filter(t => t.id !== tokenId);
      });
    } catch (err) {
      console.error('Error collecting token:', err);
    }
  };

  const handleTouch = (evt: any) => {
    if (!isPlaying || gameOver) return;
    
    const { locationX, locationY } = evt.nativeEvent;
    
    tokens.forEach(token => {
      const tokenY = (token.y as any)._value;
      if (locationX >= token.x && locationX <= token.x + 60 && 
          locationY >= tokenY && locationY <= tokenY + 60) {
        collectToken(token.id, token.type);
      }
    });
  };

  const claimAll = async () => {
    try {
      const res = await fetch(`${API_URL}/pending/${user}`);
      const data = await res.json();
      let types: number[] = [];
      data.tokens.forEach((p: any) => { 
        for (let i = 0; i < p.count; i++) types.push(p.token_type); 
      });
      
      if (types.length > 0) {
        await mockProtonSDK.transact();
        await fetch(`${API_URL}/clear`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user }) 
        });
        Alert.alert('Success!', `Claimed ${types.length} tokens to your wallet!`);
      } else {
        Alert.alert('No Tokens', 'No tokens to claim.');
      }
    } catch (err: any) { 
      Alert.alert('Claim Error', err.message); 
    }
  };

  const restartGame = () => {
    setGameOver(false);
    setTokens([]);
    startGame();
  };

  const getCurrentCityImage = () => {
    return { uri: 'https://via.placeholder.com/400x800/1a1a2e/ffffff?text=' + CITIES[level - 1] };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ImageBackground source={getCurrentCityImage()} style={styles.backgroundImage}>
        <View style={styles.overlay}>
          {/* Game UI */}
          <View style={styles.topUI}>
            <Text style={styles.levelText}>Level {level}: {CITIES[level - 1]}</Text>
            <Text style={styles.scoreText}>Score: {score}</Text>
            <Text style={styles.progressText}>Collected: {collectedThisLevel}/10</Text>
          </View>

          {/* Game Area */}
          <View style={styles.gameArea} onTouchStart={handleTouch}>
            {/* Falling Tokens */}
            {tokens.map(token => (
              <Animated.View 
                key={token.id} 
                style={[
                  styles.token, 
                  { 
                    left: token.x, 
                    backgroundColor: TOKENS[token.type - 1].color,
                    transform: [{ translateY: token.y }] 
                  }
                ]}
              >
                <Text style={styles.tokenText}>{token.type}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Login/Start UI */}
          {!user && (
            <View style={styles.centerUI}>
              <TouchableOpacity style={styles.button} onPress={login}>
                <Text style={styles.buttonText}>Login with XPR</Text>
              </TouchableOpacity>
            </View>
          )}

          {user && !isPlaying && !gameOver && (
            <View style={styles.centerUI}>
              <Text style={styles.welcomeText}>Welcome {user}!</Text>
              <TouchableOpacity style={styles.button} onPress={startGame}>
                <Text style={styles.buttonText}>Start Game</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Game Over UI */}
          {gameOver && (
            <View style={styles.gameOverOverlay}>
              <Text style={styles.gameOverTitle}>Game Over</Text>
              <Text style={styles.gameOverSubtitle}>in {CITIES[level - 1]}</Text>
              <Text style={styles.finalScore}>Final Score: {score}</Text>
              <Text style={styles.tokensCollected}>Tokens Collected: {collectedThisLevel}</Text>
              
              <View style={styles.gameOverButtons}>
                <TouchableOpacity style={styles.button} onPress={claimAll}>
                  <Text style={styles.buttonText}>Claim Tokens</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={restartGame}>
                  <Text style={styles.buttonText}>Play Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#1a1a2e'
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(26, 26, 46, 0.7)' 
  },
  topUI: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10
  },
  levelText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5
  },
  scoreText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center'
  },
  gameArea: {
    flex: 1,
    position: 'relative'
  },
  token: { 
    position: 'absolute', 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOpacity: 0.5, 
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5
  },
  tokenText: { 
    color: '#fff', 
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  centerUI: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    right: '20%',
    alignItems: 'center'
  },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  button: { 
    backgroundColor: '#4a90e2', 
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5
  },
  buttonText: {
    color: '#fff', 
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  gameOverOverlay: { 
    position: 'absolute', 
    top: '30%', 
    left: '10%', 
    right: '10%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
    padding: 30, 
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a90e2'
  },
  gameOverTitle: { 
    color: '#fff', 
    fontSize: 32, 
    fontWeight: 'bold',
    marginBottom: 10
  },
  gameOverSubtitle: {
    color: '#4a90e2',
    fontSize: 18,
    marginBottom: 20
  },
  finalScore: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 10
  },
  tokensCollected: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 30
  },
  gameOverButtons: {
    width: '100%'
  }
});

export default App;
