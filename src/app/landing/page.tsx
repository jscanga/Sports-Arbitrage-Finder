'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronRight, Github, Mail, ExternalLink, FolderOpen, Cpu, Zap, Code2, Sparkles } from 'lucide-react';
import { Press_Start_2P } from 'next/font/google';


// Fixed PongGame Component
function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ player: 0, computer: 0 });
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');

  const gameState = useRef({
    ballX: 400,
    ballY: 300,
    ballSpeedX: 4,
    ballSpeedY: 4,
    playerPaddleY: 250,
    computerPaddleY: 250,
    paddleHeight: 100,
    paddleWidth: 15,
    animationId: 0 as number
  });

  const checkGameOver = (newScore: { player: number, computer: number }) => {
    if (newScore.player >= 5) {
      setGameOver(true);
      setWinner('PLAYER');
      setGameActive(false);
    } else if (newScore.computer >= 5) {
      setGameOver(true);
      setWinner('CPU');
      setGameActive(false);
    }
  };

  const resetGame = () => {
    setScore({ player: 0, computer: 0 });
    setGameOver(false);
    setWinner('');
    resetBall();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#00ff00';
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    const { ballX, ballY, playerPaddleY, computerPaddleY, paddleHeight, paddleWidth } = gameState.current;

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(20, playerPaddleY, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - 20 - paddleWidth, computerPaddleY, paddleWidth, paddleHeight);

    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '32px "Press Start 2P"';
    ctx.fillText(score.player.toString(), canvas.width / 4, 50);
    ctx.fillText(score.computer.toString(), (3 * canvas.width) / 4, 50);

    // Game over message
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff00';
      ctx.font = '24px "Press Start 2P"';
      ctx.fillText(`${winner} WINS!`, canvas.width / 2 - 120, canvas.height / 2 - 20);
      ctx.font = '16px "Press Start 2P"';
      ctx.fillText('CLICK PLAY TO RESTART', canvas.width / 2 - 160, canvas.height / 2 + 20);
    }
  }, [score, gameOver, winner]);

  const update = useCallback(() => {
    if (gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !gameActive) return;

    const state = gameState.current;

    // Move ball
    state.ballX += state.ballSpeedX;
    state.ballY += state.ballSpeedY;

    // Ball collision with top and bottom
    if (state.ballY <= 8 || state.ballY >= canvas.height - 8) {
      state.ballSpeedY = -state.ballSpeedY;
      state.ballY = Math.max(8, Math.min(canvas.height - 8, state.ballY));
    }

    // Player paddle collision (left side)
    if (state.ballX <= 20 + state.paddleWidth + 8 && 
        state.ballX >= 20 &&
        state.ballY >= state.playerPaddleY - 8 && 
        state.ballY <= state.playerPaddleY + state.paddleHeight + 8) {
      
      // Only process collision if ball is moving toward the paddle
      if (state.ballSpeedX < 0) {
        // Calculate hit position (from -1 to 1)
        const hitPosition = (state.ballY - (state.playerPaddleY + state.paddleHeight / 2)) / (state.paddleHeight / 2);
        
        // Reverse X direction and add angle based on hit position
        state.ballSpeedX = Math.abs(state.ballSpeedX);
        state.ballSpeedY = hitPosition * 5;
        
        // Ensure ball moves to the right after collision
        state.ballSpeedX = Math.abs(state.ballSpeedX);
        state.ballX = 20 + state.paddleWidth + 9;
      }
    }

    // Computer paddle collision (right side)
    if (state.ballX >= canvas.width - 20 - state.paddleWidth - 8 && 
        state.ballX <= canvas.width - 20 &&
        state.ballY >= state.computerPaddleY - 8 && 
        state.ballY <= state.computerPaddleY + state.paddleHeight + 8) {
      
      // Only process collision if ball is moving toward the paddle
      if (state.ballSpeedX > 0) {
        // Calculate hit position (from -1 to 1)
        const hitPosition = (state.ballY - (state.computerPaddleY + state.paddleHeight / 2)) / (state.paddleHeight / 2);
        
        // Reverse X direction and add angle based on hit position
        state.ballSpeedX = -Math.abs(state.ballSpeedX);
        state.ballSpeedY = hitPosition * 5;
        
        // Ensure ball moves to the left after collision
        state.ballSpeedX = -Math.abs(state.ballSpeedX);
        state.ballX = canvas.width - 20 - state.paddleWidth - 9;
      }
    }

    // Computer AI
    const computerPaddleCenter = state.computerPaddleY + state.paddleHeight / 2;
    const ballToPaddleDistance = state.ballY - computerPaddleCenter;
    const reactionSpeed = 0.08 + (Math.random() * 0.04);
    state.computerPaddleY += ballToPaddleDistance * reactionSpeed;

    // Keep computer paddle in bounds
    state.computerPaddleY = Math.max(0, Math.min(canvas.height - state.paddleHeight, state.computerPaddleY));

    // Score points and reset ball
    if (state.ballX < 0) {
      const newScore = { ...score, computer: score.computer + 1 };
      setScore(newScore);
      resetBall();
      checkGameOver(newScore);
    } else if (state.ballX > canvas.width) {
      const newScore = { ...score, player: score.player + 1 };
      setScore(newScore);
      resetBall();
      checkGameOver(newScore);
    }
  }, [gameActive, gameOver, score]);

  const resetBall = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameState.current.ballX = canvas.width / 2;
    gameState.current.ballY = canvas.height / 2;
    // Always reset to initial speed when a point is scored
    gameState.current.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 4;
    gameState.current.ballSpeedY = (Math.random() * 2 - 1) * 3;
  };

  const gameLoop = useCallback(() => {
    update();
    draw();
    if (gameActive && !gameOver) {
      gameState.current.animationId = requestAnimationFrame(gameLoop);
    }
  }, [update, draw, gameActive, gameOver]);

  useEffect(() => {
    if (gameActive && !gameOver) {
      gameState.current.animationId = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(gameState.current.animationId);
    }

    return () => {
      cancelAnimationFrame(gameState.current.animationId);
    };
  }, [gameActive, gameOver, gameLoop]);

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

  const handlePlayPause = () => {
    if (gameOver) {
      resetGame();
      setGameActive(true);
    } else {
      setGameActive(!gameActive);
    }
  };

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
            onClick={handlePlayPause}
            className="px-4 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-400 hover:bg-green-500/30 transition-colors text-sm"
          >
            {gameOver ? 'RESTART' : gameActive ? 'PAUSE' : 'PLAY'}
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
        {!gameActive && score.player === 0 && score.computer === 0 && !gameOver && (
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
        First to 5 points wins! Ball speed resets after each point.
      </div>
    </motion.div>
  );
}

const pressStart = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
});

export default function ScholarshipPortfolio() {
  const [currentView, setCurrentView] = useState<'boot' | 'main' | 'about' | 'projects' | 'contact'>('boot');
  const [commandHistory, setCommandHistory] = useState<{command: string, output: string[]}[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  // Boot sequence messages
  const bootMessages = [
    "INITIALIZING SYSTEM...",
    "LOADING BIOS v2.4...",
    "MEMORY TEST: 64K OK",
    "BOOTING FROM HARD DISK...",
    "LOADING KERNEL...",
    "MOUNTING FILESYSTEMS...",
    "STARTING SERVICES...",
    "WELCOME TO CHORD OS",
    " ",
    "TYPE 'help' FOR AVAILABLE COMMANDS"
  ];

  useEffect(() => {
    if (currentView === 'boot') {
      const timer = setTimeout(() => {
        setCurrentView('main');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory, currentView]);

  const executeCommand = (cmd: string) => {
    const output: string[] = [];
    const cleanCmd = cmd.trim().toLowerCase();

    switch (cleanCmd) {
      case 'help':
        output.push(
          "AVAILABLE COMMANDS:",
          "  about     - Learn about the developer",
          "  projects  - View project portfolio", 
          "  contact   - Get contact information",
          "  clear     - Clear terminal",
          "  reboot    - Restart terminal",
          "  date      - Show current date",
          "  ls        - List directory contents"
        );
        break;

      case 'about':
        output.push(
          "DEVELOPER PROFILE",
          "=================",
          "NAME: JAMES SCANGA",
          "ROLE: Full-Stack Developer & University of Pittsburgh Student",
          "SPECIALTY: Building fun tools for my friends, myself, and the world",
          " ",
          "PASSIONATE ABOUT:",
          "• Collecting old technology and refurbishing it",
          "• Developing my own video games and textures", 
          "• Solving complex technical challenges",
          "• Continuous learning and growth :)"
        );
        setCurrentView('about');
        break;

      case 'projects':
        output.push(
          "PROJECT PORTFOLIO",
          "=================",
          "SIDEKICK - Academic Management Platform",
          "• Full-stack student dashboard",
          "• Grade tracking & GPA calculation",
          "• Schedule management & ICS import",
          "• Canvas API integration",
          " ",
          "TECH STACK: Next.js, TypeScript, Tailwind, Framer Motion",
          "=================",
          "HYPE TRAIN - Party video game",
          "• Personally made textures and animations",
          "• Eight different minigames",
          "• Multiplayer and singleplayer compatibility",
          "TECH STACK: GameMaker, Blender, HTML5"
        );
        setCurrentView('projects');
        break;

      case 'contact':
        output.push(
          "CONTACT INFORMATION", 
          "===================",
          "EMAIL: jas1337@pitt.edu",
          "GITHUB: github.com/jscanga",
          "LINKEDIN: /to be made",
          " ",
          "AVAILABLE FOR:",
          "• Scholarship opportunities",
          "• Collaborative projects",
          "• Research opportunities"
        );
        setCurrentView('contact');
        break;

      case 'clear':
        setCommandHistory([]);
        return;

      case 'reboot':
        setCurrentView('boot');
        setCommandHistory([]);
        setTimeout(() => setCurrentView('main'), 3000);
        return;

      case 'date':
        output.push(new Date().toLocaleString());
        break;

      case 'ls':
        output.push(
          "bin/    dev/    etc/    home/",
          "lib/    mnt/    opt/    proc/",
          "root/   run/    sbin/   srv/",
          "tmp/    usr/    var/    sidekick/"
        );
        break;

      case 'whoami':
        output.push("[YOUR NAME] - Aspiring Software Engineer");
        break;

      default:
        if (cleanCmd) {
          output.push(`Command not found: ${cmd}. Type 'help' for available commands.`);
        }
    }

    if (cleanCmd && cleanCmd !== 'clear' && cleanCmd !== 'reboot') {
      setCommandHistory(prev => [...prev, { command: cmd, output }]);
    }
    setCurrentCommand('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
    }
  };

  if (currentView === 'boot') {
    return (
      <div className={`min-h-screen bg-black text-green-400 p-8 flex items-center justify-center ${pressStart.className}`}>
        <div className="max-w-2xl w-full">
          {bootMessages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.3 }}
              className="mb-1"
            >
              {message}
              {index === bootMessages.length - 1 && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="ml-1"
                >
                  _
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-emerald-900/40 via-black to-slate-900/40 text-green-400 ${pressStart.className}`}>
      {/* Terminal Header */}
      <div className="bg-gray-800 border-b border-green-500/30 p-4">
        <div className="flex items-center space-x-2 max-w-7xl mx-auto">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex-1 text-center">
            <Terminal size={16} className="inline mr-2" />
            <span className="text-sm">chord-dev@portfolio:~</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Terminal Window - Left side */}
          <div className="lg:col-span-3">
            <div 
              ref={terminalRef}
              className="bg-black/90 border border-green-500/30 rounded-lg h-[500px] overflow-y-auto p-6 mb-4 terminal-scrollbar"
            >
              <div className="mb-4">
                <div className="text-emerald-400 text-xs leading-4">
                  <pre>
{`     ██╗ █████╗ ███╗   ███╗███████╗███████╗
     ██║██╔══██╗████╗ ████║██╔════╝██╔════╝
     ██║███████║██╔████╔██║█████╗  ███████╗
██   ██║██╔══██║██║╚██╔╝██║██╔══╝  ╚════██║
╚█████╔╝██║  ██║██║ ╚═╝ ██║███████╗███████║
 ╚════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝`}
                  </pre>
                </div>
                <div className="text-green-400 mt-4 text-sm">
                  Welcome to my interactive portfolio. Type 'help' to begin.
                </div>
              </div>

              {/* Command History */}
              {commandHistory.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="text-green-800">
                    <ChevronRight size={16} className="inline mr-2" />
                    {item.command}
                  </div>
                  {item.output.map((line, lineIndex) => (
                    <div key={lineIndex} className="ml-4 text-green-300 text-sm">{line}</div>
                  ))}
                </div>
              ))}

{/* Current Command Input with working cursor */}
<div className="flex items-center mt-4">
  <span className="text-cyan-400 mr-2">
    <ChevronRight size={16} className="inline" />
  </span>
  <div className="flex-1 relative">
    <input
      type="text"
      value={currentCommand}
      onChange={(e) => setCurrentCommand(e.target.value)}
      onKeyPress={handleKeyPress}
      className="w-full bg-transparent border-none outline-none text-green-400 caret-green-400"
      placeholder="Type a command..."
      autoFocus
    />
    {/* Optional: Add blinking cursor indicator after input */}
    {currentCommand === '' && (
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="absolute left-0 top-0 text-green-400 pointer-events-none"
      >
        _
      </motion.span>
    )}
  </div>
</div>
            </div>

            {/* Quick Commands */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['about', 'projects', 'contact', 'help', 'reboot', 'clear'].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => executeCommand(cmd)}
                  className="bg-black-800 hover:bg-green-500/20 border border-green-500/30 rounded p-3 text-green-400 hover:text-green-300 transition-all duration-200"
                >
                  {cmd}
                </button>
              ))}
            </div>
            <div className="lg:col-span-3">
  <PongGame />
</div>
          </div>

{/* Visual Display Panel - Right side */}
<div className="space-y-6">
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-black/50 border border-green-500/30 rounded-lg p-6"
  >
    <div className="flex items-center mb-4">
      <Cpu size={20} className="text-cyan-400 mr-2" />
      <h3 className="text-med font-bold text-green-400">SYSTEM STATUS</h3>
    </div>
    <div className="space-y-4 text-sm">
      {/* Motivation */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-400">Motivation:</span>
          <motion.span 
            className="text-green-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            73%
          </motion.span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: '73%' }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </motion.div>
        </div>
      </div>

      {/* Sleep */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-400">Sleep:</span>
          <motion.span 
            className="text-cyan-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            34%
          </motion.span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-cyan-500 to-blue-400 h-3 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: '34%' }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" 
                 style={{ animationDelay: '0.5s' }}></div>
          </motion.div>
        </div>
      </div>

      {/* Degree Progress */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-400">Degree Progress:</span>
          <motion.span 
            className="text-purple-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            41%
          </motion.span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-purple-500 to-fuchsia-400 h-3 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: '41%' }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" 
                 style={{ animationDelay: '1s' }}></div>
            {/* Progress dots */}
            <div className="absolute right-0 top-0 w-1 h-3 bg-white/40 animate-pulse"></div>
          </motion.div>
        </div>
      </div>
    </div>
  </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/50 border border-cyan-500/30 rounded-lg p-6"
            >
              <div className="flex items-center mb-4">
                <Zap size={20} className="text-yellow-400 mr-2" />
                <h3 className="text-lg font-bold text-cyan-400">ACTIVE PROJECT</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Sidekick App</span>
                  <Sparkles size={16} className="text-yellow-400" />
                </div>
                <div className="text-sm text-green-300">
                  Academic management platform with real-time analytics and integrated tools.
                </div>
                <div className="flex space-x-2 pt-2">
<a 
  href="/dashboard" 
  className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded p-2 text-xs text-cyan-400 transition-colors flex items-center justify-center"
>
  <ExternalLink size={12} className="inline mr-1" />
  DEMO
</a>
<a 
  href="https://github.com/jscanga/Sidekick/" 
  target="_blank" 
  rel="noopener noreferrer"
  className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded p-2 text-xs text-green-400 transition-colors flex items-center justify-center"
>
  <Github size={12} className="inline mr-1" />
  CODE
</a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/50 border border-purple-500/30 rounded-lg p-6"
            >
<div className="flex items-center mb-4">
  <Code2 size={20} className="text-purple-400 mr-2" />
  <h3 className="text-lg font-bold text-purple-400">SOCIALS</h3>
</div>
<div className="space-y-2 text-xs">
  {/* GitHub */}
  <a 
    href="https://github.com/jscanga" 
    target="_blank" 
    rel="noopener noreferrer"
    className="bg-purple-500/10 border border-purple-500/30 rounded p-3 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-200 flex items-center justify-between group"
  >
    <div className="flex items-center">
      <Github size={14} className="mr-2" />
      <span>GitHub</span>
    </div>
    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
  </a>
  
  {/* YouTube */}
  <a 
    href="https://youtube.com/@jscangaa" 
    target="_blank" 
    rel="noopener noreferrer"
    className="bg-purple-500/10 border border-purple-500/30 rounded p-3 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-200 flex items-center justify-between group"
  >
    <div className="flex items-center">
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
      </svg>
      <span>YouTube</span>
    </div>
    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
  </a>
  
  {/* Discord - Not a link */}
  <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 text-purple-300 flex items-center justify-between">
    <div className="flex items-center">
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02C2.44 8.78 1.56 12.23 2.09 15.57c.01.02.02.04.03.05c1.57 1.16 3.1 1.83 4.59 2.29c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.49-.46 3.02-1.13 4.59-2.29c.01-.01.02-.03.03-.05c.6-3.9-.73-7.33-2.85-10.22c-.01-.01-.02-.02-.04-.02zM8.74 13.61c-.99 0-1.8-.9-1.8-2s.8-2 1.8-2c1 0 1.8.9 1.8 2s-.8 2-1.8 2zm6.52 0c-.99 0-1.8-.9-1.8-2s.8-2 1.8-2c1 0 1.8.9 1.8 2s-.8 2-1.8 2z"/>
      </svg>
      <span>Discord</span>
    </div>
    <span className="text-cyan-400 font-mono">jqmezz</span>
  </div>
</div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Matrix Effect */}
      <MatrixRain />

      <style jsx>{`
        .terminal-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .terminal-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .terminal-scrollbar::-webkit-scrollbar-thumb {
          background: #00ff00;
          border-radius: 4px;
        }
        input::placeholder {
          color: #00ff00;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

// Enhanced Matrix Rain Component
const MatrixRain = () => {
  const [drops, setDrops] = useState<number[]>([]);

  useEffect(() => {
    // Initialize drops
    setDrops(Array.from({ length: 50 }, () => Math.floor(Math.random() * 100)));
    
    const interval = setInterval(() => {
      setDrops(prev => prev.map(drop => (drop > 100 ? 0 : drop + 1)));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

  return (
    <div className="fixed inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
      {drops.map((start, index) => (
        <div
          key={index}
          className="absolute text-green-400 text-sm font-mono animate-pulse"
          style={{
            left: `${(index * 2) % 100}%`,
            top: `${start}%`,
            animationDelay: `${index * 0.1}s`,
            textShadow: '0 0 8px #00ff00, 0 0 16px #00ff00'
          }}
        >
          {characters[Math.floor(Math.random() * characters.length)]}
        </div>
      ))}
    </div>
  );
};