class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.camera = { x: 0, y: 0 };
        this.gameSpeed = 2;
        this.levelDistance = 0;
        
        this.mario = new Mario(100, this.height - 150);
        this.platforms = [];
        this.enemies = [];
        this.powerUps = [];
        this.coins = [];
        this.fireballs = [];
        
        this.keys = {};
        this.gameRunning = true;
        
        this.generateInitialLevel();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    generateInitialLevel() {
        // Ground platforms
        for (let i = 0; i < 200; i++) {
            this.platforms.push(new Platform(i * 40, this.height - 40, 40, 40, 'ground'));
        }
        
        // Floating platforms
        for (let i = 0; i < 150; i++) {
            let x = Math.random() * 7000 + 200;
            let y = Math.random() * (this.height - 200) + 100;
            let width = 80 + Math.random() * 120;
            this.platforms.push(new Platform(x, y, width, 20, 'floating'));
            
            // Add coins above some platforms
            if (Math.random() < 0.3) {
                this.coins.push(new Coin(x + width/2, y - 30));
            }
            
            // Add enemies on some platforms
            if (Math.random() < 0.4) {
                this.enemies.push(new Goomba(x + 20, y - 30));
            }
            
            // Add power-ups occasionally
            if (Math.random() < 0.15) {
                let powerUpType = Math.random();
                if (powerUpType < 0.4) {
                    this.powerUps.push(new SizePowerUp(x + width/2, y - 40));
                } else if (powerUpType < 0.7) {
                    this.powerUps.push(new FireFlower(x + width/2, y - 40));
                } else if (powerUpType < 0.85) {
                    this.powerUps.push(new StarPowerUp(x + width/2, y - 40));
                } else if (powerUpType < 0.95) {
                    this.powerUps.push(new SpeedBoost(x + width/2, y - 40));
                } else {
                    this.powerUps.push(new LifeUp(x + width/2, y - 40));
                }
            }
        }
        
        // Add pipes as obstacles
        for (let i = 0; i < 20; i++) {
            let x = Math.random() * 6000 + 400;
            this.platforms.push(new Platform(x, this.height - 120, 60, 80, 'pipe'));
        }
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Update Mario
        this.mario.update(this.keys, this.platforms);
        
        // Update camera to follow Mario
        this.camera.x = this.mario.x - this.width / 3;
        this.camera.y = this.mario.y - this.height / 2;
        
        // Keep camera in bounds
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.camera.y > 0) this.camera.y = 0;
        if (this.camera.y < -this.height) this.camera.y = -this.height;
        
        // Update enemies
        this.enemies.forEach(enemy => enemy.update(this.platforms));
        
        // Update fireballs
        this.fireballs.forEach(fireball => fireball.update());
        
        // Remove fireballs that are off screen or hit enemies
        this.fireballs = this.fireballs.filter(fireball => {
            if (fireball.x < this.camera.x - 100 || fireball.x > this.camera.x + this.width + 100) {
                return false;
            }
            
            // Check fireball collision with enemies
            let hitEnemy = false;
            this.enemies = this.enemies.filter(enemy => {
                if (this.checkCollision(fireball, enemy)) {
                    this.score += 200;
                    hitEnemy = true;
                    return false;
                }
                return true;
            });
            
            return !hitEnemy;
        });
        
        // Spawn fireballs when Mario shoots
        if (this.keys['KeyX'] && this.mario.canShoot()) {
            this.fireballs.push(new Fireball(this.mario.x + this.mario.width, this.mario.y + 10, this.mario.facing));
        }
        
        // Check collisions with enemies
        this.enemies = this.enemies.filter(enemy => {
            if (this.checkCollision(this.mario, enemy)) {
                if (this.mario.dy > 0 && this.mario.y < enemy.y) {
                    // Mario jumped on enemy
                    this.mario.dy = -15;
                    this.score += 100;
                    return false; // Remove enemy
                } else {
                    // Mario hit enemy from side
                    if (!this.mario.invulnerable) {
                        this.mario.takeDamage();
                        this.lives--;
                        this.updateUI();
                        if (this.lives <= 0) {
                            this.gameOver();
                        }
                    }
                }
            }
            return true;
        });
        
        // Check collisions with coins
        this.coins = this.coins.filter(coin => {
            if (this.checkCollision(this.mario, coin)) {
                this.score += 50;
                this.updateUI();
                return false; // Remove coin
            }
            return true;
        });
        
        // Check collisions with power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            if (this.checkCollision(this.mario, powerUp)) {
                powerUp.applyEffect(this.mario, this);
                this.updateUI();
                return false; // Remove power-up
            }
            return true;
        });
        
        // Generate more level content as Mario progresses
        if (this.mario.x > this.levelDistance - 1000) {
            this.generateMoreLevel();
        }
        
        // Check if Mario fell off the world
        if (this.mario.y > this.height + 100) {
            this.mario.x = 100;
            this.mario.y = this.height - 150;
            this.mario.dx = 0;
            this.mario.dy = 0;
            this.lives--;
            this.updateUI();
            if (this.lives <= 0) {
                this.gameOver();
            }
        }
        
        // Level progression
        if (this.mario.x > this.level * 2000) {
            this.level++;
            this.gameSpeed += 0.5;
            this.updateUI();
        }
    }
    
    generateMoreLevel() {
        let startX = this.levelDistance;
        
        // Ground platforms
        for (let i = 0; i < 50; i++) {
            this.platforms.push(new Platform(startX + i * 40, this.height - 40, 40, 40, 'ground'));
        }
        
        // Floating platforms
        for (let i = 0; i < 30; i++) {
            let x = Math.random() * 2000 + startX;
            let y = Math.random() * (this.height - 200) + 100;
            let width = 80 + Math.random() * 120;
            this.platforms.push(new Platform(x, y, width, 20, 'floating'));
            
            if (Math.random() < 0.3) {
                this.coins.push(new Coin(x + width/2, y - 30));
            }
            
            if (Math.random() < 0.5) {
                this.enemies.push(new Goomba(x + 20, y - 30));
            }
            
            if (Math.random() < 0.2) {
                let powerUpType = Math.random();
                if (powerUpType < 0.4) {
                    this.powerUps.push(new SizePowerUp(x + width/2, y - 40));
                } else if (powerUpType < 0.7) {
                    this.powerUps.push(new FireFlower(x + width/2, y - 40));
                } else if (powerUpType < 0.85) {
                    this.powerUps.push(new StarPowerUp(x + width/2, y - 40));
                } else if (powerUpType < 0.95) {
                    this.powerUps.push(new SpeedBoost(x + width/2, y - 40));
                } else {
                    this.powerUps.push(new LifeUp(x + width/2, y - 40));
                }
            }
        }
        
        // Add more pipes
        for (let i = 0; i < 5; i++) {
            let x = Math.random() * 2000 + startX;
            this.platforms.push(new Platform(x, this.height - 120, 60, 80, 'pipe'));
        }
        
        this.levelDistance += 2000;
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw platforms
        this.platforms.forEach(platform => {
            if (platform.x + platform.width > this.camera.x - 100 && 
                platform.x < this.camera.x + this.width + 100) {
                platform.draw(this.ctx);
            }
        });
        
        // Draw coins
        this.coins.forEach(coin => {
            if (coin.x > this.camera.x - 50 && coin.x < this.camera.x + this.width + 50) {
                coin.draw(this.ctx);
            }
        });
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            if (powerUp.x > this.camera.x - 50 && powerUp.x < this.camera.x + this.width + 50) {
                powerUp.draw(this.ctx);
            }
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            if (enemy.x > this.camera.x - 50 && enemy.x < this.camera.x + this.width + 50) {
                enemy.draw(this.ctx);
            }
        });
        
        // Draw fireballs
        this.fireballs.forEach(fireball => {
            if (fireball.x > this.camera.x - 50 && fireball.x < this.camera.x + this.width + 50) {
                fireball.draw(this.ctx);
            }
        });
        
        // Draw Mario
        this.mario.draw(this.ctx);
        
        // Restore context
        this.ctx.restore();
    }
    
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('level').textContent = `Level: ${this.level}`;
        document.getElementById('lives').textContent = `Lives: ${this.lives}`;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2);
        this.ctx.font = '24px Courier New';
        this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 60);
        this.ctx.fillText('Refresh to play again', this.width / 2, this.height / 2 + 100);
    }
    
    gameLoop() {
        this.update();
        this.render();
        if (this.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

class Mario {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.dx = 0;
        this.dy = 0;
        this.speed = 5;
        this.baseSpeed = 5;
        this.jumpPower = 18;
        this.onGround = false;
        this.powered = false;
        this.fireMode = false;
        this.starMode = false;
        this.speedBoost = false;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.starTime = 0;
        this.speedBoostTime = 0;
        this.lastFireTime = 0;
        this.fireDelay = 20;
        this.facing = 1;
    }
    
    update(keys, platforms) {
        // Handle input
        if (keys['ArrowLeft']) {
            this.dx = -this.speed;
            this.facing = -1;
        } else if (keys['ArrowRight']) {
            this.dx = this.speed;
            this.facing = 1;
        } else {
            this.dx *= 0.8; // Friction
        }
        
        if (keys['Space'] && this.onGround) {
            this.dy = -this.jumpPower;
            this.onGround = false;
        }
        
        // Apply gravity
        this.dy += 0.8;
        if (this.dy > 15) this.dy = 15;
        
        // Update position
        this.x += this.dx;
        this.y += this.dy;
        
        // Platform collision
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                // Landing on top
                if (this.dy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.dy = 0;
                    this.onGround = true;
                }
                // Hitting from below
                else if (this.dy < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.dy = 0;
                }
                // Hitting from sides
                else if (this.dx > 0) {
                    this.x = platform.x - this.width;
                    this.dx = 0;
                } else if (this.dx < 0) {
                    this.x = platform.x + platform.width;
                    this.dx = 0;
                }
            }
        });
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTime--;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Update star power
        if (this.starMode) {
            this.starTime--;
            if (this.starTime <= 0) {
                this.starMode = false;
                this.invulnerable = false;
            }
        }
        
        // Update speed boost
        if (this.speedBoost) {
            this.speedBoostTime--;
            if (this.speedBoostTime <= 0) {
                this.speedBoost = false;
                this.speed = this.baseSpeed;
            }
        }
        
        // Update fire delay
        if (this.lastFireTime > 0) {
            this.lastFireTime--;
        }
    }
    
    takeDamage() {
        if (this.starMode) return; // Star mode prevents damage
        
        if (this.fireMode) {
            this.fireMode = false;
        } else if (this.powered) {
            this.powered = false;
            this.height = 32;
        }
        this.invulnerable = true;
        this.invulnerabilityTime = 120;
    }
    
    canShoot() {
        return this.fireMode && this.lastFireTime <= 0;
    }
    
    shoot() {
        if (this.canShoot()) {
            this.lastFireTime = this.fireDelay;
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        if (this.invulnerable && Math.floor(this.invulnerabilityTime / 5) % 2) {
            return; // Flashing effect
        }
        
        let bodyColor = '#FF0000';
        if (this.starMode && Math.floor(Date.now() / 100) % 5 === 0) {
            bodyColor = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'][Math.floor(Math.random() * 5)];
        } else if (this.fireMode) {
            bodyColor = '#FFA500';
        } else if (this.powered) {
            bodyColor = '#FF6B6B';
        }
        
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Simple Mario face
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(this.x + 8, this.y + 8, 16, 16);
        
        // Hat
        let hatColor = this.fireMode ? '#FFFFFF' : '#FF0000';
        ctx.fillStyle = hatColor;
        ctx.fillRect(this.x + 4, this.y + 4, 24, 8);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 10, this.y + 12, 2, 2);
        ctx.fillRect(this.x + 20, this.y + 12, 2, 2);
        
        // Mustache
        ctx.fillRect(this.x + 12, this.y + 18, 8, 2);
    }
}

class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }
    
    draw(ctx) {
        switch(this.type) {
            case 'ground':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(this.x, this.y - 5, this.width, 5);
                break;
            case 'floating':
                ctx.fillStyle = '#D2691E';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                break;
            case 'pipe':
                ctx.fillStyle = '#228B22';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(this.x + 5, this.y, this.width - 10, 10);
                ctx.fillRect(this.x + 5, this.y + this.height - 10, this.width - 10, 10);
                break;
            default:
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Goomba {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.dx = -1;
        this.dy = 0;
        this.onGround = false;
    }
    
    update(platforms) {
        // Apply gravity
        this.dy += 0.5;
        if (this.dy > 10) this.dy = 10;
        
        // Update position
        this.x += this.dx;
        this.y += this.dy;
        
        // Platform collision
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                if (this.dy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.dy = 0;
                    this.onGround = true;
                } else if (this.dx > 0) {
                    this.x = platform.x - this.width;
                    this.dx = -Math.abs(this.dx);
                } else if (this.dx < 0) {
                    this.x = platform.x + platform.width;
                    this.dx = Math.abs(this.dx);
                }
            }
        });
    }
    
    draw(ctx) {
        // Body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + 4, this.y + 4, 4, 4);
        ctx.fillRect(this.x + 16, this.y + 4, 4, 4);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 6, this.y + 6, 2, 2);
        ctx.fillRect(this.x + 18, this.y + 6, 2, 2);
        
        // Mouth
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 14, 8, 2);
        
        // Feet
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 2, this.y + this.height, 6, 4);
        ctx.fillRect(this.x + 16, this.y + this.height, 6, 4);
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.bobOffset = 0;
        this.bobSpeed = 0.1;
    }
    
    draw(ctx) {
        this.bobOffset += this.bobSpeed;
        let yPos = this.y + Math.sin(this.bobOffset) * 3;
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x, yPos, this.width, this.height);
        
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(this.x + 2, yPos + 2, this.width - 4, this.height - 4);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 6, yPos + 6, 4, 4);
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.bobOffset = 0;
        this.bobSpeed = 0.08;
    }
    
    applyEffect(mario, game) {
        // Override in subclasses
    }
}

class SizePowerUp extends PowerUp {
    applyEffect(mario, game) {
        if (!mario.powered) {
            mario.powered = true;
            mario.height = 48;
        }
        game.score += 200;
    }
    
    draw(ctx) {
        this.bobOffset += this.bobSpeed;
        let yPos = this.y + Math.sin(this.bobOffset) * 2;
        
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(this.x, yPos, this.width, 12);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + 4, yPos + 2, 4, 4);
        ctx.fillRect(this.x + 12, yPos + 2, 4, 4);
        ctx.fillRect(this.x + 8, yPos + 6, 4, 4);
        ctx.fillStyle = '#FFFF88';
        ctx.fillRect(this.x + 8, yPos + 10, 4, 10);
    }
}

class FireFlower extends PowerUp {
    applyEffect(mario, game) {
        mario.fireMode = true;
        if (!mario.powered) {
            mario.powered = true;
            mario.height = 48;
        }
        game.score += 300;
    }
    
    draw(ctx) {
        this.bobOffset += this.bobSpeed;
        let yPos = this.y + Math.sin(this.bobOffset) * 2;
        
        // Flower petals
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(this.x + 6, yPos, 8, 4);
        ctx.fillRect(this.x + 10, yPos + 4, 8, 4);
        ctx.fillRect(this.x + 6, yPos + 8, 8, 4);
        ctx.fillRect(this.x + 2, yPos + 4, 8, 4);
        
        // Center
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(this.x + 8, yPos + 4, 4, 4);
        
        // Stem
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(this.x + 9, yPos + 12, 2, 8);
    }
}

class StarPowerUp extends PowerUp {
    applyEffect(mario, game) {
        mario.starMode = true;
        mario.invulnerable = true;
        mario.starTime = 600; // 10 seconds
        game.score += 500;
    }
    
    draw(ctx) {
        this.bobOffset += this.bobSpeed;
        let yPos = this.y + Math.sin(this.bobOffset) * 3;
        
        // Star shape (simplified)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 8, yPos, 4, 8); // vertical
        ctx.fillRect(this.x + 4, yPos + 4, 12, 4); // horizontal
        ctx.fillRect(this.x + 6, yPos + 2, 8, 4); // diagonal
        ctx.fillRect(this.x + 6, yPos + 6, 8, 4); // diagonal
        
        // Sparkle effect
        if (Math.random() < 0.3) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x + Math.random() * 20, yPos + Math.random() * 20, 2, 2);
        }
    }
}

class SpeedBoost extends PowerUp {
    applyEffect(mario, game) {
        mario.speedBoost = true;
        mario.speed = mario.baseSpeed * 1.5;
        mario.speedBoostTime = 300; // 5 seconds
        game.score += 150;
    }
    
    draw(ctx) {
        this.bobOffset += this.bobSpeed;
        let yPos = this.y + Math.sin(this.bobOffset) * 2;
        
        // Lightning bolt shape
        ctx.fillStyle = '#00AAFF';
        ctx.fillRect(this.x + 8, yPos, 4, 10);
        ctx.fillRect(this.x + 4, yPos + 4, 8, 2);
        ctx.fillRect(this.x + 6, yPos + 8, 8, 2);
        
        // Speed lines
        ctx.fillStyle = '#AAAAFF';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(this.x - 4 - i * 3, yPos + 6 + i * 2, 6, 1);
        }
    }
}

class LifeUp extends PowerUp {
    applyEffect(mario, game) {
        game.lives++;
        game.score += 1000;
    }
    
    draw(ctx) {
        this.bobOffset += this.bobSpeed;
        let yPos = this.y + Math.sin(this.bobOffset) * 2;
        
        // Green mushroom
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(this.x, yPos, this.width, 12);
        
        // White spots
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + 4, yPos + 2, 4, 4);
        ctx.fillRect(this.x + 12, yPos + 2, 4, 4);
        ctx.fillRect(this.x + 8, yPos + 6, 4, 4);
        
        // Stem
        ctx.fillStyle = '#FFFF88';
        ctx.fillRect(this.x + 8, yPos + 10, 4, 10);
    }
}

class Fireball {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.dx = direction * 8;
        this.dy = 0;
        this.bounces = 0;
        this.maxBounces = 3;
    }
    
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.dy += 0.3; // Gravity
    }
    
    draw(ctx) {
        // Fireball core
        ctx.fillStyle = '#FF4400';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Inner flame
        ctx.fillStyle = '#FFAA00';
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        
        // Hottest center
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 3, this.y + 3, 2, 2);
    }
}

// Start the game
window.addEventListener('load', () => {
    new Game();
});