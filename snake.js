class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.gridCount = this.canvas.width / this.gridSize;
        
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 1, y: 0};
        this.food = {x: 15, y: 10};
        
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore') || '0');
        this.gameLoop = null;
        this.isRunning = false;
        this.isPaused = false;
        this.aiEnabled = false;
        this.aiStrategy = 'astar';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.draw();
        this.updateUI();
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('toggleAI').addEventListener('click', () => this.toggleAI());
        document.getElementById('strategy').addEventListener('change', (e) => {
            this.aiStrategy = e.target.value;
            document.getElementById('current-strategy').textContent = this.getStrategyName();
        });
        
        document.addEventListener('keydown', (e) => {
            if (!this.aiEnabled && this.isRunning && !this.isPaused) {
                this.handleKeyPress(e);
            }
        });
    }
    
    getStrategyName() {
        const names = {
            'astar': 'A* 寻路',
            'advanced': '高级 AI',
            'ml': '强化学习'
        };
        return names[this.aiStrategy] || 'A* 寻路';
    }
    
    handleKeyPress(e) {
        const keyMap = {
            ArrowUp: {x: 0, y: -1},
            ArrowDown: {x: 0, y: 1},
            ArrowLeft: {x: -1, y: 0},
            ArrowRight: {x: 1, y: 0},
            w: {x: 0, y: -1},
            s: {x: 0, y: 1},
            a: {x: -1, y: 0},
            d: {x: 1, y: 0}
        };
        
        const newDirection = keyMap[e.key];
        if (newDirection) {
            e.preventDefault();
            if (newDirection.x !== -this.direction.x || newDirection.y !== -this.direction.y) {
                this.direction = newDirection;
            }
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.gameLoop = setInterval(() => this.update(), 150);
            this.updateStatus('游戏进行中');
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isPaused = !this.isPaused;
            this.updateStatus(this.isPaused ? '已暂停' : '游戏进行中');
        }
    }
    
    reset() {
        clearInterval(this.gameLoop);
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 1, y: 0};
        this.score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.spawnFood();
        this.draw();
        this.updateUI();
        this.updateStatus('准备开始');
    }
    
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        document.getElementById('ai-status').textContent = this.aiEnabled ? '开启' : '关闭';
        document.getElementById('strategy-selector').style.display = this.aiEnabled ? 'block' : 'none';
        if (this.aiEnabled && !this.isRunning) {
            this.start();
        }
    }
    
    update() {
        if (this.isPaused) return;
        
        if (this.aiEnabled) {
            this.aiMove();
        }
        
        this.moveSnake();
        
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        
        if (this.checkFoodCollision()) {
            this.eatFood();
        }
        
        this.draw();
        this.updateUI();
    }
    
    moveSnake() {
        const head = {...this.snake[0]};
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        this.snake.unshift(head);
        this.snake.pop();
    }
    
    checkCollision() {
        const head = this.snake[0];
        
        if (head.x < 0 || head.x >= this.gridCount || 
            head.y < 0 || head.y >= this.gridCount) {
            return true;
        }
        
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    checkFoodCollision() {
        const head = this.snake[0];
        return head.x === this.food.x && head.y === this.food.y;
    }
    
    eatFood() {
        const tail = {...this.snake[this.snake.length - 1]};
        this.snake.push(tail);
        this.score += 10;
        this.spawnFood();
    }
    
    spawnFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.gridCount),
                y: Math.floor(Math.random() * this.gridCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        this.food = newFood;
    }
    
    draw() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00ff88';
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.fillStyle = '#00ffaa';
            } else {
                const alpha = 1 - (index / this.snake.length) * 0.5;
                this.ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
            }
            this.ctx.beginPath();
            this.ctx.roundRect(
                segment.x * this.gridSize + 2,
                segment.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4,
                4
            );
            this.ctx.fill();
        });
        
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('snake-length').textContent = this.snake.length;
    }
    
    updateStatus(status) {
        document.getElementById('status').textContent = status;
    }
    
    gameOver() {
        clearInterval(this.gameLoop);
        this.isRunning = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore.toString());
        }
        
        this.updateStatus('游戏结束');
        this.updateUI();
    }
    
    aiMove() {
        switch (this.aiStrategy) {
            case 'advanced':
                this.advancedAIMove();
                break;
            case 'ml':
                this.mlAIMove();
                break;
            default:
                this.basicAIMove();
        }
    }
    
    basicAIMove() {
        const head = this.snake[0];
        const path = this.findPath(head, this.food);
        
        if (path && path.length > 1) {
            const nextStep = path[1];
            this.direction = {
                x: nextStep.x - head.x,
                y: nextStep.y - head.y
            };
        } else {
            this.moveToSafePosition();
        }
    }
    
    advancedAIMove() {
        const head = this.snake[0];
        const bestMove = this.findBestMove();
        
        if (bestMove) {
            this.direction = {
                x: bestMove.x - head.x,
                y: bestMove.y - head.y
            };
        } else {
            this.moveToSafePosition();
        }
    }
    
    findBestMove() {
        const head = this.snake[0];
        const neighbors = this.getNeighbors(head);
        
        if (neighbors.length === 0) return null;
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const neighbor of neighbors) {
            const score = this.evaluateMove(neighbor);
            if (score > bestScore) {
                bestScore = score;
                bestMove = neighbor;
            }
        }
        
        return bestMove;
    }
    
    evaluateMove(position) {
        let score = 0;
        
        const distanceToFood = this.heuristic(position, this.food);
        score -= distanceToFood * 10;
        
        const distanceToCenter = this.heuristic(position, {x: this.gridCount/2, y: this.gridCount/2});
        score -= distanceToCenter * 2;
        
        const availableSpace = this.calculateAvailableSpace(position);
        score += availableSpace * 5;
        
        const danger = this.calculateDanger(position);
        score -= danger * 100;
        
        if (this.willCollideSoon(position)) {
            score -= 1000;
        }
        
        return score;
    }
    
    calculateAvailableSpace(start) {
        const visited = new Set();
        const queue = [start];
        let count = 0;
        
        while (queue.length > 0 && count < 100) {
            const pos = queue.shift();
            const key = `${pos.x},${pos.y}`;
            
            if (visited.has(key)) continue;
            if (pos.x < 0 || pos.x >= this.gridCount || pos.y < 0 || pos.y >= this.gridCount) continue;
            if (this.snake.some(seg => seg.x === pos.x && seg.y === pos.y)) continue;
            
            visited.add(key);
            count++;
            
            queue.push({x: pos.x + 1, y: pos.y});
            queue.push({x: pos.x - 1, y: pos.y});
            queue.push({x: pos.x, y: pos.y + 1});
            queue.push({x: pos.x, y: pos.y - 1});
        }
        
        return count;
    }
    
    calculateDanger(position) {
        let danger = 0;
        
        if (position.x === 0 || position.x === this.gridCount - 1) danger += 1;
        if (position.y === 0 || position.y === this.gridCount - 1) danger += 1;
        
        const head = this.snake[0];
        for (let i = 1; i < this.snake.length; i++) {
            const dist = this.heuristic(position, this.snake[i]);
            if (dist <= 2) {
                danger += (2 - dist) * 0.5;
            }
        }
        
        return danger;
    }
    
    willCollideSoon(position) {
        const testSnake = [position, ...this.snake.slice(0, -1)];
        
        for (let steps = 0; steps < this.snake.length; steps++) {
            const futureHead = testSnake[0];
            
            if (futureHead.x < 0 || futureHead.x >= this.gridCount || 
                futureHead.y < 0 || futureHead.y >= this.gridCount) {
                return true;
            }
            
            for (let i = 1; i < testSnake.length; i++) {
                if (futureHead.x === testSnake[i].x && futureHead.y === testSnake[i].y) {
                    return true;
                }
            }
            
            const nearestNeighbor = this.getNeighbors(futureHead);
            if (nearestNeighbor.length === 0) return true;
            
            const nextPos = nearestNeighbor[0];
            testSnake.unshift(nextPos);
            testSnake.pop();
        }
        
        return false;
    }
    
    mlAIMove() {
        const head = this.snake[0];
        
        const state = this.getGameState();
        const qValues = this.predictQValues(state);
        
        const directions = [
            {x: 0, y: -1},
            {x: 0, y: 1},
            {x: -1, y: 0},
            {x: 1, y: 0}
        ];
        
        let bestDir = null;
        let bestQ = -Infinity;
        
        for (let i = 0; i < directions.length; i++) {
            const dir = directions[i];
            const nextX = head.x + dir.x;
            const nextY = head.y + dir.y;
            
            if (nextX >= 0 && nextX < this.gridCount && nextY >= 0 && nextY < this.gridCount) {
                if (!this.snake.some(seg => seg.x === nextX && seg.y === nextY)) {
                    if (qValues[i] > bestQ) {
                        bestQ = qValues[i];
                        bestDir = dir;
                    }
                }
            }
        }
        
        if (bestDir) {
            this.direction = bestDir;
        } else {
            this.moveToSafePosition();
        }
    }
    
    getGameState() {
        const head = this.snake[0];
        
        const state = {
            headX: head.x / this.gridCount,
            headY: head.y / this.gridCount,
            foodX: this.food.x / this.gridCount,
            foodY: this.food.y / this.gridCount,
            snakeLength: this.snake.length / this.gridCount,
            dirX: this.direction.x,
            dirY: this.direction.y,
            dangerUp: this.isDangerous(head.x, head.y - 1),
            dangerDown: this.isDangerous(head.x, head.y + 1),
            dangerLeft: this.isDangerous(head.x - 1, head.y),
            dangerRight: this.isDangerous(head.x + 1, head.y)
        };
        
        return state;
    }
    
    isDangerous(x, y) {
        if (x < 0 || x >= this.gridCount || y < 0 || y >= this.gridCount) return 1;
        if (this.snake.some(seg => seg.x === x && seg.y === y)) return 1;
        return 0;
    }
    
    predictQValues(state) {
        const inputs = [
            state.headX, state.headY,
            state.foodX, state.foodY,
            state.snakeLength,
            state.dirX, state.dirY,
            state.dangerUp, state.dangerDown,
            state.dangerLeft, state.dangerRight
        ];
        
        const weights = [
            [-0.5, 0.8, 1.2, -0.3, -0.1, 0.4, -0.2, -2.0, -2.0, -2.0, -2.0],
            [-0.3, 1.0, 0.9, -0.5, -0.1, -0.3, 0.5, -2.0, -2.0, -2.0, -2.0],
            [0.8, -0.4, -0.6, 1.1, -0.1, -0.5, 0.3, -2.0, -2.0, -2.0, -2.0],
            [-0.4, -0.6, 0.7, 1.0, -0.1, 0.3, -0.4, -2.0, -2.0, -2.0, -2.0]
        ];
        
        const qValues = [];
        
        for (let i = 0; i < 4; i++) {
            let q = 0;
            for (let j = 0; j < inputs.length; j++) {
                q += inputs[j] * weights[i][j];
            }
            
            if (i === 0 && state.dangerUp) q = -10;
            if (i === 1 && state.dangerDown) q = -10;
            if (i === 2 && state.dangerLeft) q = -10;
            if (i === 3 && state.dangerRight) q = -10;
            
            qValues.push(q);
        }
        
        return qValues;
    }
    
    findPath(start, end) {
        const openSet = [start];
        const cameFrom = {};
        const gScore = {};
        const fScore = {};
        
        const key = (pos) => `${pos.x},${pos.y}`;
        
        gScore[key(start)] = 0;
        fScore[key(start)] = this.heuristic(start, end);
        
        while (openSet.length > 0) {
            openSet.sort((a, b) => fScore[key(a)] - fScore[key(b)]);
            const current = openSet.shift();
            
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }
            
            for (const neighbor of this.getNeighbors(current)) {
                const tentativeG = gScore[key(current)] + 1;
                
                if (!gScore[key(neighbor)] || tentativeG < gScore[key(neighbor)]) {
                    cameFrom[key(neighbor)] = current;
                    gScore[key(neighbor)] = tentativeG;
                    fScore[key(neighbor)] = tentativeG + this.heuristic(neighbor, end);
                    
                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        
        return null;
    }
    
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    getNeighbors(pos) {
        const neighbors = [];
        const directions = [
            {x: 0, y: -1},
            {x: 0, y: 1},
            {x: -1, y: 0},
            {x: 1, y: 0}
        ];
        
        for (const dir of directions) {
            const nx = pos.x + dir.x;
            const ny = pos.y + dir.y;
            
            if (nx >= 0 && nx < this.gridCount &&
                ny >= 0 && ny < this.gridCount &&
                !this.snake.some(seg => seg.x === nx && seg.y === ny)) {
                neighbors.push({x: nx, y: ny});
            }
        }
        
        return neighbors;
    }
    
    reconstructPath(cameFrom, current) {
        const path = [current];
        const key = (pos) => `${pos.x},${pos.y}`;
        
        while (cameFrom[key(current)]) {
            current = cameFrom[key(current)];
            path.unshift(current);
        }
        
        return path;
    }
    
    moveToSafePosition() {
        const head = this.snake[0];
        const neighbors = this.getNeighbors(head);
        
        if (neighbors.length === 0) return;
        
        const safeMoves = neighbors.filter(n => {
            const tempSnake = [n, ...this.snake.slice(0, -1)];
            return this.isMoveSafe(tempSnake);
        });
        
        if (safeMoves.length > 0) {
            const bestMove = safeMoves.reduce((best, curr) => {
                const bestDist = this.heuristic(best, {x: this.gridCount/2, y: this.gridCount/2});
                const currDist = this.heuristic(curr, {x: this.gridCount/2, y: this.gridCount/2});
                return currDist < bestDist ? curr : best;
            });
            this.direction = {
                x: bestMove.x - head.x,
                y: bestMove.y - head.y
            };
        } else {
            const randomMove = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.direction = {
                x: randomMove.x - head.x,
                y: randomMove.y - head.y
            };
        }
    }
    
    isMoveSafe(snake) {
        const head = snake[0];
        
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return false;
            }
        }
        
        return true;
    }
}

window.addEventListener('load', () => {
    new SnakeGame();
});