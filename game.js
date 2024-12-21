class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        
        // Paddle properties
        this.paddle = {
            width: 100,
            height: 20,
            x: this.canvas.width / 2 - 50,
            y: this.canvas.height - 30,
            speed: 8,
            dx: 0
        };
        
        // Ball properties
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            dx: 4,
            dy: -4,
            radius: 8
        };
        
        // Blocks configuration
        this.blocks = [];
        this.blockColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF'];
        this.initBlocks();
        
        // Input handling
        this.rightPressed = false;
        this.leftPressed = false;
        this.setupControls();
        
        // Start the game loop
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
        
        // Audio elements
        this.sounds = {
            hit: document.getElementById('hitSound'),
            paddleHit: document.getElementById('paddleHitSound'),
            break: document.getElementById('breakSound'),
            loseLife: document.getElementById('loseLifeSound'),
            gameOver: document.getElementById('gameOverSound')
        };
        
        // Restart button
        this.restartButton = document.getElementById('restartButton');
        this.restartButton.addEventListener('click', () => this.restart());
        
        // Improved paddle physics
        this.lastPaddleX = this.paddle.x;
    }
    
    initBlocks() {
        const blockWidth = 80;
        const blockHeight = 20;
        const padding = 10;
        const offsetTop = 50;
        const offsetLeft = (this.canvas.width - (blockWidth + padding) * 8 + padding) / 2;
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 8; col++) {
                this.blocks.push({
                    x: col * (blockWidth + padding) + offsetLeft,
                    y: row * (blockHeight + padding) + offsetTop,
                    width: blockWidth,
                    height: blockHeight,
                    color: this.blockColors[row],
                    active: true
                });
            }
        }
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Right' || e.key === 'ArrowRight') {
                this.rightPressed = true;
            } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
                this.leftPressed = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Right' || e.key === 'ArrowRight') {
                this.rightPressed = false;
            } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
                this.leftPressed = false;
            }
        });
    }
    
    movePaddle() {
        if (this.rightPressed && this.paddle.x < this.canvas.width - this.paddle.width) {
            this.paddle.x += this.paddle.speed;
        } else if (this.leftPressed && this.paddle.x > 0) {
            this.paddle.x -= this.paddle.speed;
        }
    }
    
    moveBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Wall collision
        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            this.ball.dx = -this.ball.dx;
            this.sounds.hit.play();
        }
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
            this.sounds.hit.play();
        }
        
        // Improved paddle collision with angle reflection
        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.y + this.ball.radius < this.paddle.y + this.paddle.height &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {
            
            // Calculate relative position of ball on paddle (0-1)
            let relativeIntersectX = (this.ball.x - (this.paddle.x + this.paddle.width/2)) / (this.paddle.width/2);
            
            // Calculate angle based on where ball hits paddle (-60 to 60 degrees)
            let bounceAngle = relativeIntersectX * Math.PI/3;
            
            // Calculate new velocity components
            let speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
            this.ball.dx = speed * Math.sin(bounceAngle);
            this.ball.dy = -speed * Math.cos(bounceAngle);
            
            // Add paddle movement influence
            let paddleSpeed = this.paddle.x - this.lastPaddleX;
            this.ball.dx += paddleSpeed * 0.2;
            
            this.sounds.paddleHit.play();
        }
        
        // Ball missed paddle
        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.lives--;
            this.livesElement.textContent = this.lives;
            
            if (this.lives === 0) {
                this.gameOver = true;
                this.sounds.gameOver.play();
            } else {
                this.sounds.loseLife.play();
                this.resetBall();
            }
        }
        
        // Store paddle position for next frame
        this.lastPaddleX = this.paddle.x;
    }
    
    checkBlockCollision() {
        for (let block of this.blocks) {
            if (!block.active) continue;
            
            // Simple rectangular collision detection
            if (this.ball.x + this.ball.radius > block.x &&
                this.ball.x - this.ball.radius < block.x + block.width &&
                this.ball.y + this.ball.radius > block.y &&
                this.ball.y - this.ball.radius < block.y + block.height) {
                
                block.active = false;
                this.score += 10;
                this.scoreElement.textContent = this.score;
                this.sounds.break.play();
                
                // Determine bounce direction
                if (this.ball.y + this.ball.radius > block.y + block.height ||
                    this.ball.y - this.ball.radius < block.y) {
                    this.ball.dy = -this.ball.dy;
                } else {
                    this.ball.dx = -this.ball.dx;
                }
                
                // Check if all blocks are destroyed
                if (this.blocks.every(b => !b.active)) {
                    this.gameOver = true;
                    this.sounds.gameOver.play();
                }
                
                break;
            }
        }
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 50;
        this.ball.dx = 4;
        this.ball.dy = -4;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (if you want to keep it)
        this.drawGrid();
        
        // Draw blocks first
        this.blocks.forEach(block => {
            if (block.active) {
                // Simple block drawing for debugging
                this.ctx.fillStyle = block.color;
                this.ctx.fillRect(block.x, block.y, block.width, block.height);
                this.ctx.strokeStyle = '#000';
                this.ctx.strokeRect(block.x, block.y, block.width, block.height);
            }
        });
        
        // Draw paddle
        this.ctx.fillStyle = '#4ecca3';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#4ecca3';
        this.ctx.fill();
        this.ctx.closePath();
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.font = 'bold 52px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameLoop() {
        if (!this.gameOver) {
            this.movePaddle();
            this.moveBall();
            this.checkBlockCollision();
        }
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
    
    restart() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        
        // Reset paddle
        this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
        
        // Reset ball
        this.resetBall();
        
        // Reset blocks
        this.blocks = [];
        this.initBlocks();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(78, 204, 163, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x < this.canvas.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y < this.canvas.height; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return `#${(1 << 24) + (R << 16) + (G << 8) + B}`.slice(1);
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(1 << 24) + (R << 16) + (G << 8) + B}`.slice(1);
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 