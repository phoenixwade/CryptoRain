class CryptoRainGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        this.user = null;
        this.tokens = [];
        this.level = 1;
        this.speedMultiplier = 1;
        this.isPlaying = false;
        this.gameOver = false;
        this.collectedThisLevel = 0;
        this.levelStartTime = 0;
        this.score = 0;
        this.nextId = 0;
        this.spawnInterval = null;
        this.animationFrame = null;
        
        this.cities = ['NewYork', 'Tokyo', 'London', 'Paris', 'Berlin', 'Sydney', 'RioDeJaneiro', 'Dubai', 'Shanghai', 'Toronto'];
        this.cityImages = {};
        this.currentCityImage = null;
        
        this.tokenTypes = Array.from({length: 15}, (_, i) => ({
            id: i + 1,
            name: `Token${i + 1}`,
            color: `hsl(${i * 24}, 80%, 50%)`,
            weight: i < 10 ? 50 : i < 13 ? 20 : 5
        }));
        
        this.API_URL = window.CryptoRainConfig?.API_URL || 'https://cryptokaraoke.io/api';
        this.leaderboard = [];
        
        this.initializeProtonSDK();
        this.setupEventListeners();
        this.loadCityImages();
        this.loadLeaderboard();
        this.gameLoop();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async initializeProtonSDK() {
        try {
            if (typeof ProtonWebSDK !== 'undefined') {
                this.protonSDK = new ProtonWebSDK({
                    endpoints: window.CryptoRainConfig?.PROTON_ENDPOINTS || ['https://proton-testnet.greymass.com'],
                    appName: window.CryptoRainConfig?.APP_NAME || 'CryptoRain',
                    requestAccount: window.CryptoRainConfig?.SMART_CONTRACT_ACCOUNT || 'gamecontract',
                    requestStatus: 'active'
                });
                console.log('Proton SDK initialized');
            } else {
                console.warn('Proton SDK not loaded, using mock');
                this.protonSDK = {
                    login: () => Promise.resolve({ actor: 'testuser' }),
                    transact: () => Promise.resolve()
                };
            }
        } catch (error) {
            console.error('Failed to initialize Proton SDK:', error);
            this.protonSDK = {
                login: () => Promise.resolve({ actor: 'testuser' }),
                transact: () => Promise.resolve()
            };
        }
    }
    
    setupEventListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('claimBtn').addEventListener('click', () => this.claimAll());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick(e.touches[0]);
        });
    }
    
    loadCityImages() {
        this.cities.forEach(city => {
            const img = new Image();
            img.src = `${window.CryptoRainConfig?.PLACEHOLDER_IMAGE_BASE || 'https://via.placeholder.com/800x600/1a1a2e/ffffff?text='}${city}`;
            img.onload = () => {
                this.cityImages[city] = img;
                if (city === this.cities[0]) {
                    this.currentCityImage = img;
                }
            };
        });
    }
    
    async loadLeaderboard() {
        try {
            const response = await fetch(`${this.API_URL}/leaderboard`);
            if (response.ok) {
                this.leaderboard = await response.json();
                this.updateLeaderboardDisplay();
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    }
    
    updateLeaderboardDisplay() {
        const list = document.getElementById('leaderboardList');
        if (this.leaderboard.length === 0) {
            list.innerHTML = '<div class="leaderboard-entry"><span>No scores yet</span><span></span></div>';
            return;
        }
        
        list.innerHTML = this.leaderboard.map((entry, index) => 
            `<div class="leaderboard-entry">
                <span>${index + 1}. ${entry.user.substring(0, 8)}...</span>
                <span>${entry.score}</span>
            </div>`
        ).join('');
    }
    
    pickTokenType() {
        const total = this.tokenTypes.reduce((sum, t) => sum + t.weight, 0);
        let rand = Math.random() * total;
        for (let i = 0; i < this.tokenTypes.length; i++) {
            rand -= this.tokenTypes[i].weight;
            if (rand <= 0) return i + 1;
        }
        return 1;
    }
    
    async login() {
        try {
            const result = await this.protonSDK.login();
            this.user = result.actor;
            
            document.getElementById('loginBtn').classList.add('hidden');
            document.getElementById('startBtn').classList.remove('hidden');
            document.getElementById('welcomeText').classList.remove('hidden');
            document.getElementById('welcomeText').textContent = `Welcome ${this.user}!`;
            
            console.log('Login successful:', this.user);
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed: ' + error.message);
        }
    }
    
    async startGame() {
        if (!this.user) {
            alert('Please login first');
            return;
        }
        
        try {
            await this.protonSDK.transact({
                actions: [{
                    account: window.CryptoRainConfig?.SMART_CONTRACT_ACCOUNT || 'gamecontract',
                    name: 'startgame',
                    authorization: [{ actor: this.user, permission: 'active' }],
                    data: { user: this.user }
                }]
            });
            
            this.level = 1;
            this.speedMultiplier = 1;
            this.isPlaying = true;
            this.gameOver = false;
            this.tokens = [];
            this.collectedThisLevel = 0;
            this.levelStartTime = Date.now();
            this.score = 0;
            this.nextId = 0;
            
            this.currentCityImage = this.cityImages[this.cities[0]];
            this.updateUI();
            
            document.getElementById('centerUI').classList.add('hidden');
            this.startSpawning();
            
        } catch (error) {
            console.error('Start game failed:', error);
            alert('Failed to start game: ' + error.message);
        }
    }
    
    startSpawning() {
        if (this.spawnInterval) clearInterval(this.spawnInterval);
        
        this.spawnInterval = setInterval(() => {
            if (!this.isPlaying || this.gameOver) return;
            
            const type = this.pickTokenType();
            const x = Math.random() * (this.canvas.width - 60);
            const speed = (Math.random() * 1 + 2) * this.speedMultiplier;
            
            const token = {
                id: this.nextId++,
                type,
                x,
                y: -60,
                speed,
                collected: false
            };
            
            this.tokens.push(token);
        }, Math.max(400, 1000 - (this.level * 50)));
    }
    
    gameLoop() {
        this.update();
        this.render();
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (!this.isPlaying || this.gameOver) return;
        
        this.tokens = this.tokens.filter(token => {
            if (token.collected) return false;
            
            token.y += token.speed;
            
            if (token.y > this.canvas.height) {
                this.endGame();
                return false;
            }
            
            return true;
        });
        
        if (this.collectedThisLevel >= 10 || (Date.now() - this.levelStartTime > 30000)) {
            if (this.level < 10) {
                this.levelUp();
            }
        }
    }
    
    levelUp() {
        this.level++;
        this.speedMultiplier += 0.5;
        this.collectedThisLevel = 0;
        this.levelStartTime = Date.now();
        this.currentCityImage = this.cityImages[this.cities[this.level - 1]];
        this.updateUI();
        
        alert(`Level Up! Welcome to Level ${this.level} - ${this.cities[this.level - 1]}!`);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentCityImage) {
            this.ctx.globalAlpha = 0.3;
            this.ctx.drawImage(this.currentCityImage, 0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;
        }
        
        this.tokens.forEach(token => {
            if (!token.collected) {
                this.renderToken(token);
            }
        });
        
        this.renderParticles();
    }
    
    renderToken(token) {
        const tokenData = this.tokenTypes[token.type - 1];
        
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        
        this.ctx.fillStyle = tokenData.color;
        this.ctx.beginPath();
        this.ctx.arc(token.x + 30, token.y + 30, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Roboto';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(token.type.toString(), token.x + 30, token.y + 30);
        
        this.ctx.restore();
    }
    
    renderParticles() {
    }
    
    handleClick(e) {
        if (!this.isPlaying || this.gameOver) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const y = (e.clientY || e.pageY) - rect.top;
        
        this.tokens.forEach(token => {
            if (!token.collected && 
                x >= token.x && x <= token.x + 60 && 
                y >= token.y && y <= token.y + 60) {
                this.collectToken(token);
            }
        });
    }
    
    async collectToken(token) {
        token.collected = true;
        
        try {
            await fetch(`${this.API_URL}/collect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: this.user, token_type: token.type })
            });
            
            this.collectedThisLevel++;
            this.score += token.type > 13 ? 100 : token.type > 10 ? 50 : 10;
            this.updateUI();
            
        } catch (error) {
            console.error('Error collecting token:', error);
        }
    }
    
    updateUI() {
        document.getElementById('levelText').textContent = `Level ${this.level}: ${this.cities[this.level - 1]}`;
        document.getElementById('scoreText').textContent = `Score: ${this.score}`;
        document.getElementById('progressText').textContent = `Collected: ${this.collectedThisLevel}/10`;
    }
    
    endGame() {
        this.isPlaying = false;
        this.gameOver = true;
        
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
        
        document.getElementById('gameOverSubtitle').textContent = `in ${this.cities[this.level - 1]}`;
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        document.getElementById('tokensCollected').textContent = `Tokens Collected: ${this.collectedThisLevel}`;
        document.getElementById('gameOverOverlay').style.display = 'block';
        
        this.submitScore();
    }
    
    async submitScore() {
        try {
            await fetch(`${this.API_URL}/submit-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: this.user, score: this.score })
            });
            
            await this.loadLeaderboard();
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }
    
    async claimAll() {
        try {
            const res = await fetch(`${this.API_URL}/pending/${this.user}`);
            const data = await res.json();
            let types = [];
            data.tokens.forEach(p => {
                for (let i = 0; i < p.count; i++) types.push(p.token_type);
            });
            
            if (types.length > 0) {
                await this.protonSDK.transact({
                    actions: [{
                        account: window.CryptoRainConfig?.SMART_CONTRACT_ACCOUNT || 'gamecontract',
                        name: 'claimmulti',
                        authorization: [{ actor: this.user, permission: 'active' }],
                        data: { user: this.user, types }
                    }]
                });
                
                await fetch(`${this.API_URL}/clear`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: this.user })
                });
                
                alert(`Claimed ${types.length} tokens to your wallet!`);
            } else {
                alert('No tokens to claim.');
            }
        } catch (error) {
            console.error('Claim error:', error);
            alert('Claim failed: ' + error.message);
        }
    }
    
    restartGame() {
        this.gameOver = false;
        this.tokens = [];
        document.getElementById('gameOverOverlay').style.display = 'none';
        this.startGame();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CryptoRainGame();
});
