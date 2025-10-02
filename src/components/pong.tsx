'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

// Simple Pong component
const PongGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ player: 0, computer: 0 });
  const [gameActive, setGameActive] = useState(false);

  // Game state
  const gameState = useRef({
    ballX: 400,
    ballY: 300,
    ballSpeedX: 5,
    ballSpeedY: 5,
    playerPaddleY: 250,
    computerPaddleY: 250,
    paddleHeight: 100,
    paddleWidth: 10
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#00ff00';
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    const { ballX, ballY, playerPaddleY, computerPaddleY, paddleHeight, paddleWidth } = gameState.current;

    // Draw paddles
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(20, playerPaddleY, paddleWidth, paddleHeight); // Player paddle
    ctx.fillRect(canvas.width - 30, computerPaddleY, paddleWidth, paddleHeight); // Computer paddle

    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw scores
    ctx.font = '32px "Press Start 2P"';
    ctx.fillText(score.player.toString(), canvas.width / 4, 50);
    ctx.fillText(score.computer.toString(), (3 * canvas.width) / 4, 50);
  }, [score]);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameActive) return;

    const state = gameState.current;

    // Move ball
    state.ballX += state.ballSpeedX;
    state.ballY += state.ballSpeedY;

    // Ball collision with top and bottom
    if (state.ballY <= 0 || state.ballY >= canvas.height) {
      state.ballSpeedY = -state.ballSpeedY;
    }

    // Ball collision with paddles
    if (state.ballX <= 30 && state.ballY >= state.playerPaddleY && state.ballY <= state.playerPaddleY + state.paddleHeight) {
      state.ballSpeedX = -state.ballSpeedX;
      // Add some randomness to ball angle
      state.ballSpeedY = (state.ballY - (state.playerPaddleY + state.paddleHeight / 2)) * 0.3;
    }

    if (state.ballX >= canvas.width - 30 && state.ballY >= state.computerPaddleY && state.ballY <= state.computerPaddleY + state.paddleHeight) {
      state.ballSpeedX = -state.ballSpeedX;
      state.ballSpeedY = (state.ballY - (state.computerPaddleY + state.paddleHeight / 2)) * 0.3;
    }

    // Computer AI (simple follow)
    state.computerPaddleY += (state.ballY - (state.computerPaddleY + state.paddleHeight / 2)) * 0.1;

    // Score points
    if (state.ballX < 0) {
      setScore(prev => ({ ...prev, computer: prev.computer + 1 }));
      resetBall();
    } else if (state.ballX > canvas.width) {
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      resetBall();
    }

    // Keep computer paddle in bounds
    state.computerPaddleY = Math.max(0, Math.min(canvas.height - state.paddleHeight, state.computerPaddleY));
  }, [gameActive]);

  const resetBall = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameState.current.ballX = canvas.width / 2;
    gameState.current.ballY = canvas.height / 2;
    gameState.current.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 5;
    gameState.current.ballSpeedY = (Math.random() * 2 - 1) * 5;
  };

  const gameLoop = useCallback(() => {
    update();
    draw();
    if (gameActive) {
      requestAnimationFrame(gameLoop);
    }
  }, [update, draw, gameActive]);

  useEffect(() => {
    if (gameActive) {
      gameLoop();
    }
  }, [gameActive, gameLoop]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      gameState.current.playerPaddleY = Math.max(0, Math.min(canvas.height - gameState.current.paddleHeight, mouseY - gameState.current.paddleHeight / 2));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/50 border border-green-500/30 rounded-lg p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-green-400">RETRO PONG</h3>
        <div className="flex items-center space-x-4">
          <div className="text-cyan-400 text-sm">
            PLAYER: <span className="text-green-400">{score.player}</span>
          </div>
          <div className="text-cyan-400 text-sm">
            CPU: <span className="text-red-400">{score.computer}</span>
          </div>
          <button
            onClick={() => {
              setGameActive(!gameActive);
              if (!gameActive) {
                setScore({ player: 0, computer: 0 });
                resetBall();
              }
            }}
            className="px-4 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-400 hover:bg-green-500/30 transition-colors text-sm"
          >
            {gameActive ? 'PAUSE' : 'PLAY'}
          </button>
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-64 border border-green-500/30 rounded bg-black cursor-none"
        />
        {!gameActive && score.player === 0 && score.computer === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="text-green-400 text-lg mb-2">CONTROLS</div>
              <div className="text-cyan-400 text-sm">Move mouse to control paddle</div>
              <div className="text-gray-400 text-xs mt-2">Click PLAY to start</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-gray-400 text-xs mt-3 text-center">
        First to 5 points wins! Move mouse vertically to control your paddle.
      </div>
    </motion.div>
  );
};