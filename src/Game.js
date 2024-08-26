import React, { useEffect, useRef, useState, useCallback } from 'react';

// Constants for game physics
const GRAVITY = 0.5;
const JUMP_STRENGTH = -10;
const DOUBLE_JUMP_STRENGTH = -8;
const MOVE_SPEED = 5;
const ACCELERATION = 0.2;
const MAX_SPEED = 10;
const GROUND_Y = 550;
const LANDING_TIME = 30;

// Boss constants
const BOSS_JUMP_STRENGTH = -15;
const BOSS_MOVE_SPEED = 3;
const BOSS_JUMP_INTERVAL = 120;

// New constants for life gauges
const GAUGE_WIDTH = 200;
const GAUGE_HEIGHT = 20;
const GAUGE_BORDER = 2;
const GAUGE_ANIMATION_SPEED = 5;

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.hasDoubleJumped = false;
    this.isDucking = false;
    this.isAccelerating = false;
    this.facingRight = true;
    this.health = 100;
    this.sprite = new Image();
    this.sprite.src = process.env.PUBLIC_URL + '/flappy.png';
    this.landingTimer = 0;
    this.displayHealth = 100;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.displayHealth = this.health; // Immediately update displayHealth
    if (this.health < 0) this.health = 0;
  }

  jump() {
    if (!this.isJumping && this.landingTimer === 0) {
      this.velocityY = JUMP_STRENGTH;
      this.isJumping = true;
      this.hasDoubleJumped = false;
    } else if (!this.hasDoubleJumped) {
      this.velocityY = DOUBLE_JUMP_STRENGTH;
      this.hasDoubleJumped = true;
    }
  }

  duck() {
    this.isDucking = true;
    this.height = 25; // Reduce height while ducking
  }

  unduck() {
    this.isDucking = false;
    this.height = 50; // Restore original height
  }

  moveLeft(accelerate = false) {
    this.facingRight = false;
    if (accelerate) {
      this.isAccelerating = true;
      this.velocityX = Math.max(this.velocityX - ACCELERATION, -MAX_SPEED);
    } else {
      this.isAccelerating = false;
      this.velocityX = -MOVE_SPEED;
    }
  }

  moveRight(accelerate = false) {
    this.facingRight = true;
    if (accelerate) {
      this.isAccelerating = true;
      this.velocityX = Math.min(this.velocityX + ACCELERATION, MAX_SPEED);
    } else {
      this.isAccelerating = false;
      this.velocityX = MOVE_SPEED;
    }
  }

  stopMoving() {
    this.isAccelerating = false;
    this.velocityX = 0;
  }

  update() {
    // Apply gravity
    this.velocityY += GRAVITY;
    this.y += this.velocityY;
    this.x += this.velocityX;

    // Ground collision detection
    if (this.y + this.height > GROUND_Y) {
      this.y = GROUND_Y - this.height;
      this.velocityY = 0;
      if (this.isJumping) {
        this.isJumping = false;
        this.landingTimer = LANDING_TIME;
      }
    }

    // Update landing timer
    if (this.landingTimer > 0) {
      this.landingTimer--;
    }

    // Boundary checks
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > 800) this.x = 800 - this.width;

    // Deceleration when not accelerating
    if (!this.isAccelerating) {
      if (this.velocityX > 0) {
        this.velocityX = Math.max(0, this.velocityX - ACCELERATION);
      } else if (this.velocityX < 0) {
        this.velocityX = Math.min(0, this.velocityX + ACCELERATION);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    if (!this.facingRight) {
      ctx.scale(-1, 1);
      ctx.drawImage(this.sprite, -this.x - this.width, this.y, this.width, this.height);
    } else {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
    ctx.restore();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

class Boss {
    constructor(x, y, difficulty = 1) {
      this.x = x;
      this.y = y;
      this.width = 100;
      this.height = 100;
      this.health = 100;
      this.velocityX = 0;
      this.velocityY = 0;
      this.isJumping = false;
      this.sprite = new Image();
      this.sprite.src = process.env.PUBLIC_URL + '/boss.png';
      this.jumpTimer = 0;
      this.difficulty = difficulty;
      this.setDifficultyParams();
      this.landingTimer = 0;
      this.displayHealth = 100;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.displayHealth = this.health; // Immediately update displayHealth
        if (this.health < 0) this.health = 0;
      }
  
    setDifficultyParams() {
      switch (this.difficulty) {
        case 1: // Easy
          this.moveSpeed = 3;  // Increased from 2 to 3
          this.jumpStrength = -15;
          this.jumpInterval = 150;  // Reduced interval for more frequent jumps
          this.reactionTime = 50;  // Reduced reaction time for quicker response
          break;
        case 2: // Medium
          this.moveSpeed = 5;  // Increased from 3 to 5
          this.jumpStrength = -18;
          this.jumpInterval = 100;  // Reduced interval for more frequent jumps
          this.reactionTime = 30;  // Reduced reaction time for quicker response
          break;
        case 3: // Hard
          this.moveSpeed = 7;  // Increased from 4 to 7
          this.jumpStrength = -20;
          this.jumpInterval = 70;  // Reduced interval for more frequent jumps
          this.reactionTime = 10;  // Reduced reaction time for quicker response
          break;
        default:
          this.setDifficultyParams(1);
      }
    }
  
    update(playerX, playerY) {
      // Movement AI: Always chase the player
      if (this.x < playerX) {
        this.velocityX = this.moveSpeed;
      } else if (this.x > playerX) {
        this.velocityX = -this.moveSpeed;
      } else {
        this.velocityX = 0;
      }
  
      // Jumping AI
      this.jumpTimer++;
      if (this.jumpTimer >= this.jumpInterval) {
        if (this.shouldJump(playerX, playerY)) {
          this.jump();
        }
        this.jumpTimer = 0;
      }
  
      // Apply gravity
      this.velocityY += GRAVITY;
  
      // Update position
      this.x += this.velocityX;
      this.y += this.velocityY;
  
      // Ground collision detection
    if (this.y + this.height > GROUND_Y) {
        this.y = GROUND_Y - this.height;
        this.velocityY = 0;
        if (this.isJumping) {
          this.isJumping = false;
          this.landingTimer = LANDING_TIME;
        }
      }
  
      // Update landing timer
      if (this.landingTimer > 0) {
        this.landingTimer--;
      }
  
      // Boundary checks
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > 800) this.x = 800 - this.width;
    }
  
    shouldJump(playerX, playerY) {
        // Only consider jumping if the landing timer is 0
        if (this.landingTimer === 0) {
          // Jump if the player is above or in close proximity
          if (playerY < this.y || Math.abs(this.x - playerX) < this.width) {
            return true;
          }
        }
        return false;
      }
    
      jump() {
        if (!this.isJumping && this.landingTimer === 0) {
          this.velocityY = this.jumpStrength;
          this.isJumping = true;
        }
      }
  
    draw(ctx) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
  
    takeDamage(amount) {
      this.health -= amount;
      if (this.health < 0) this.health = 0;
    }
  
    getHitbox() {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height
      };
    }
  }

const Game = () => {
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const musicBufferRef = useRef(null);
    const musicSourceRef = useRef(null);
    const [player, setPlayer] = useState(null);
    const [boss, setBoss] = useState(null);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState('start');
    const [backgroundImage, setBackgroundImage] = useState(null);

    const playMusic = useCallback(async () => {
        if (audioContextRef.current && musicBufferRef.current) {
          // Check if context is in suspended state (autoplay policy)
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
    
          // If we already have a source, stop it
          if (musicSourceRef.current) {
            musicSourceRef.current.stop();
          }
    
          const source = audioContextRef.current.createBufferSource();
          source.buffer = musicBufferRef.current;
          source.connect(audioContextRef.current.destination);
          source.loop = true;
          source.start();
          musicSourceRef.current = source;
        }
      }, []);
    
      const stopMusic = useCallback(() => {
        if (musicSourceRef.current) {
          musicSourceRef.current.stop();
          musicSourceRef.current = null;
        }
      }, []);
  
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const newPlayer = new Player(100, 300);
        const newBoss = new Boss(600, GROUND_Y - 100);
        setPlayer(newPlayer);
        setBoss(newBoss);

    // Load background image
    const bgImage = new Image();
    bgImage.src = process.env.PUBLIC_URL + '/bg_lvl1.png';
    bgImage.onload = () => {
      setBackgroundImage(bgImage);
    };

    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    // Load audio file
    fetch(process.env.PUBLIC_URL + '/song.mp3')
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContextRef.current.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        musicBufferRef.current = audioBuffer;
      })
      .catch(e => console.error("Error with decoding audio data" + e.err));

    let animationFrameId;
  
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      }
            
            if (gameState === 'playing') {
              newPlayer.update();
              newBoss.update(newPlayer.x);
      
              checkCollision(newPlayer, newBoss);
      
              newPlayer.draw(ctx);
              newBoss.draw(ctx);
      
              // Draw ground
              ctx.fillStyle = 'green';
              ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
      
              // Draw UI
              drawUI(ctx, newPlayer.displayHealth, newBoss.displayHealth, score);
      
              // Animate health gauges
              animateHealthGauges(newPlayer, newBoss);
      
              // Check for game over
              if (newBoss.health <= 0) {
                setGameState('victory');
              } else if (newPlayer.health <= 0) {
                setGameState('defeat');
              }
            } else if (gameState === 'start') {
              drawStartScreen(ctx);
            } else if (gameState === 'victory') {
              drawVictoryScreen(ctx);
            } else if (gameState === 'defeat') {
              drawDefeatScreen(ctx);
            }
      
            animationFrameId = window.requestAnimationFrame(render);
          };
      
          const checkCollision = (player, boss) => {
            const playerHitbox = player.getHitbox();
            const bossHitbox = boss.getHitbox();
      
            if (playerHitbox.x < bossHitbox.x + bossHitbox.width &&
                playerHitbox.x + playerHitbox.width > bossHitbox.x &&
                playerHitbox.y + playerHitbox.height > bossHitbox.y &&
                playerHitbox.y < bossHitbox.y + bossHitbox.height) {
              
              if (player.velocityY > 0 && player.y + player.height < boss.y + boss.height / 2) {
                // Player landed on boss's head
                boss.takeDamage(10);
                player.velocityY = JUMP_STRENGTH; // Bounce off the boss
                setScore(prevScore => prevScore + 10);
              } else if (boss.velocityY > 0 && boss.y + boss.height < player.y + player.height / 2) {
                // Boss landed on player's head
                player.takeDamage(10);
                boss.velocityY = BOSS_JUMP_STRENGTH; // Bounce off the player
              }
            }
          };
      
          const drawUI = (ctx, playerHealth, bossHealth, score) => {
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.fillText(`Score: ${score}`, 10, 30);
            
            // Draw player health gauge
            drawHealthGauge(ctx, 10, 50, playerHealth, 'green');
            
            // Draw boss health gauge
            drawHealthGauge(ctx, canvas.width - GAUGE_WIDTH - 10, 50, bossHealth, 'red');
          };
      
          const drawHealthGauge = (ctx, x, y, health, color) => {
            // Draw border
            ctx.fillStyle = 'black';
            ctx.fillRect(x - GAUGE_BORDER, y - GAUGE_BORDER, GAUGE_WIDTH + 2 * GAUGE_BORDER, GAUGE_HEIGHT + 2 * GAUGE_BORDER);
            
            // Draw background
            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, GAUGE_WIDTH, GAUGE_HEIGHT);
            
            // Draw health bar
            ctx.fillStyle = color;
            ctx.fillRect(x, y, GAUGE_WIDTH * (health / 100), GAUGE_HEIGHT);
          };
      
          const animateHealthGauges = (player, boss) => {
            if (player.displayHealth > player.health) {
              player.displayHealth = Math.max(player.health, player.displayHealth - GAUGE_ANIMATION_SPEED);
            }
      
            if (boss.displayHealth > boss.health) {
              boss.displayHealth = Math.max(boss.health, boss.displayHealth - GAUGE_ANIMATION_SPEED);
            }
          };

    const drawStartScreen = (ctx) => {
      ctx.fillStyle = 'black';
      ctx.font = '40px Arial';
      ctx.fillText('Flappy Bird Boss Battle', canvas.width / 2 - 200, canvas.height / 2 - 40);
      ctx.font = '20px Arial';
      ctx.fillText('Click "Start Game" to begin', canvas.width / 2 - 100, canvas.height / 2 + 20);
    };

    const drawVictoryScreen = (ctx) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('Victory!', canvas.width / 2 - 70, canvas.height / 2 - 40);
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 60, canvas.height / 2 + 20);
        ctx.fillText('Press Space to Restart', canvas.width / 2 - 100, canvas.height / 2 + 60);
      };
  
      const drawDefeatScreen = (ctx) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2 - 40);
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 60, canvas.height / 2 + 20);
        ctx.fillText('Press Space to Restart', canvas.width / 2 - 100, canvas.height / 2 + 60);
      };

    render();

    const handleKeyDown = (event) => {
      if (gameState === 'playing' && newPlayer) {
        switch(event.key) {
          case 'z':
          case ' ':  // Space key for double jump
            newPlayer.jump();
            break;
          case 's':
            newPlayer.duck();
            break;
          case 'q':
            newPlayer.moveLeft(event.shiftKey);
            break;
          case 'd':
            newPlayer.moveRight(event.shiftKey);
            break;
        }
      } else if ((gameState === 'victory' || gameState === 'defeat') && event.key === ' ') {
        // Restart the game
        
        setGameState('start');
        setScore(0);
        const resetPlayer = new Player(100, 300);
        const resetBoss = new Boss(600, GROUND_Y - 100);
        setPlayer(resetPlayer);
        setBoss(resetBoss);
      }
    };

    const handleKeyUp = (event) => {
      if (gameState === 'playing' && newPlayer) {
        switch(event.key) {
          case 's':
            newPlayer.unduck();
            break;
          case 'q':
          case 'd':
            newPlayer.stopMoving();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopMusic();
    };
  }, [gameState, stopMusic]);

  const startGame = async () => {
    setGameState('playing');
    // Start playing music when game starts
    try {
      await playMusic();
    } catch (error) {
      console.error("Failed to play music:", error);
    }
  };

  useEffect(() => {
    // Stop music when game ends
    if (gameState === 'victory' || gameState === 'defeat') {
      stopMusic();
    }
  }, [gameState, stopMusic]);


  return (
    <div className="game-container" style={{ position: 'relative' }}>
      <canvas ref={canvasRef} width={800} height={600} />
      {gameState === 'start' && (
        <button 
          onClick={startGame}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, 100%)',
            padding: '15px 30px',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            boxShadow: '0 9px #999',
            outline: 'none',
            transition: 'all 0.1s',
          }}
          onMouseDown={(e) => {
            e.target.style.backgroundColor = '#45a049';
            e.target.style.boxShadow = '0 5px #666';
            e.target.style.transform = 'translate(-50%, 100%) translateY(4px)';
          }}
          onMouseUp={(e) => {
            e.target.style.backgroundColor = '#4CAF50';
            e.target.style.boxShadow = '0 9px #999';
            e.target.style.transform = 'translate(-50%, 100%)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#4CAF50';
            e.target.style.boxShadow = '0 9px #999';
            e.target.style.transform = 'translate(-50%, 100%)';
          }}
        >
          Start Game
        </button>
      )}
    </div>
  );
};

export default Game;