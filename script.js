(() => {
  "use strict";
  const HUMAN = "X";
  const AI = "O";
  const WIN_LINES = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  const cells = [...document.querySelectorAll(".cell")];
  const statusText = document.getElementById("statusText");
  const thinking = document.getElementById("thinking");
  const playerCard = document.getElementById("playerCard");
  const computerCard = document.getElementById("computerCard");
  const overlay = document.getElementById("resultOverlay");
  const resultTitle = document.getElementById("resultTitle");
  const resultMessage = document.getElementById("resultMessage");
  const resultSymbol = document.getElementById("resultSymbol");
  const soundToggle = document.getElementById("soundToggle");

  let board = Array(9).fill("");
  let gameOver = false;
  let aiTimer = null;
  let soundEnabled = true;
  let audioContext = null;
  let stats = loadStats();

  function loadStats() {
    try {
      const saved = JSON.parse(localStorage.getItem("1142928-hw06-stats"));
      if (saved && ["wins", "draws", "losses"].every(k => Number.isInteger(saved[k]) && saved[k] >= 0)) return saved;
    } catch (_) {}
    return { wins: 0, draws: 0, losses: 0 };
  }
  function saveStats() {
    localStorage.setItem("1142928-hw06-stats", JSON.stringify(stats));
    document.getElementById("playerWins").textContent = stats.wins;
    document.getElementById("draws").textContent = stats.draws;
    document.getElementById("computerWins").textContent = stats.losses;
  }
  function playTone(freq, duration = 0.08, type = "sine") {
    if (!soundEnabled) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + duration + 0.02);
    } catch (_) {}
  }
  function getWinner(state) {
    for (const line of WIN_LINES) {
      const [a,b,c] = line;
      if (state[a] && state[a] === state[b] && state[a] === state[c]) return { mark: state[a], line };
    }
    return null;
  }
  function minimax(state, depth, maximizing) {
    const winner = getWinner(state);
    if (winner?.mark === AI) return 10 - depth;
    if (winner?.mark === HUMAN) return depth - 10;
    if (state.every(Boolean)) return 0;

    if (maximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) if (!state[i]) {
        state[i] = AI;
        best = Math.max(best, minimax(state, depth + 1, false));
        state[i] = "";
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) if (!state[i]) {
        state[i] = HUMAN;
        best = Math.min(best, minimax(state, depth + 1, true));
        state[i] = "";
      }
      return best;
    }
  }
  // Minimax 會完整搜尋剩餘棋局；分數優先取勝、其次平手，避免可避免的敗局。
  function findBestMove() {
    let bestScore = -Infinity;
    let bestMoves = [];
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = AI;
      const score = minimax(board, 0, false);
      board[i] = "";
      if (score > bestScore) { bestScore = score; bestMoves = [i]; }
      else if (score === bestScore) bestMoves.push(i);
    }
    // 在同等最佳走法中略作隨機，讓每局不完全相同。
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }
  function render() {
    cells.forEach((cell, i) => {
      const mark = board[i];
      cell.textContent = mark === "X" ? "×" : mark === "O" ? "○" : "";
      cell.classList.toggle("o", mark === "O");
      cell.classList.toggle("filled", Boolean(mark));
      cell.disabled = Boolean(mark) || gameOver;
      cell.setAttribute("aria-label", `第 ${i + 1} 格，${mark ? (mark === "X" ? "玩家 X" : "電腦 O") : "空格"}`);
    });
  }
  function setTurn(turn) {
    playerCard.classList.toggle("active", turn === HUMAN);
    computerCard.classList.toggle("active", turn === AI);
  }
  function finish(result) {
    gameOver = true;
    thinking.classList.remove("show");
    render();
    if (result?.mark === HUMAN) {
      stats.wins++; resultTitle.textContent = "你贏了！"; resultMessage.textContent = "漂亮的一手！這次你成功連線。";
      resultSymbol.textContent = "×"; resultSymbol.style.color = "var(--cyan)";
      playTone(660, .12); setTimeout(() => playTone(880, .18), 120);
    } else if (result?.mark === AI) {
      stats.losses++; resultTitle.textContent = "電腦獲勝"; resultMessage.textContent = "這次棋高一著，再試一次吧。";
      resultSymbol.textContent = "○"; resultSymbol.style.color = "var(--pink)"; playTone(180, .2, "triangle");
    } else {
      stats.draws++; resultTitle.textContent = "平手！"; resultMessage.textContent = "精彩的對局，雙方都沒有留下破綻。";
      resultSymbol.textContent = "＝"; resultSymbol.style.color = "var(--gold)"; playTone(520, .12);
    }
    saveStats();
    statusText.textContent = result?.mark === HUMAN ? "恭喜你取得勝利！" : result?.mark === AI ? "電腦取得勝利。" : "平手！";
    if (result?.line) result.line.forEach(i => cells[i].classList.add("winner"));
    setTimeout(() => { overlay.classList.add("show"); overlay.setAttribute("aria-hidden", "false"); }, 420);
  }
  function checkEnd() {
    const winner = getWinner(board);
    if (winner) { finish(winner); return true; }
    if (board.every(Boolean)) { finish(null); return true; }
    return false;
  }
  function humanMove(index) {
    if (gameOver || board[index] || aiTimer !== null) return;
    board[index] = HUMAN;
    render(); playTone(430, .07);
    if (checkEnd()) return;
    setTurn(AI);
    statusText.textContent = "電腦正在分析最佳走法…";
    thinking.classList.add("show");
    cells.forEach(cell => cell.disabled = true);
    aiTimer = setTimeout(() => {
      const move = findBestMove();
      if (move !== undefined) board[move] = AI;
      aiTimer = null;
      thinking.classList.remove("show");
      render(); playTone(300, .08, "triangle");
      if (!checkEnd()) {
        setTurn(HUMAN);
        statusText.textContent = "輪到你了，選擇一個空格。";
      }
    }, 520);
  }
  function restart() {
    if (aiTimer !== null) { clearTimeout(aiTimer); aiTimer = null; }
    board = Array(9).fill(""); gameOver = false;
    overlay.classList.remove("show"); overlay.setAttribute("aria-hidden", "true");
    thinking.classList.remove("show");
    cells.forEach(cell => cell.classList.remove("winner"));
    setTurn(HUMAN); statusText.textContent = "輪到你了，選擇一個空格開始。";
    render();
  }

  cells.forEach(cell => cell.addEventListener("click", () => humanMove(Number(cell.dataset.index))));
  document.getElementById("restartButton").addEventListener("click", restart);
  document.getElementById("playAgainButton").addEventListener("click", restart);
  document.getElementById("resetScoreButton").addEventListener("click", () => {
    stats = { wins: 0, draws: 0, losses: 0 }; saveStats();
  });
  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? "♫" : "♪";
    soundToggle.style.color = soundEnabled ? "var(--cyan)" : "var(--muted)";
    soundToggle.setAttribute("aria-label", soundEnabled ? "關閉音效" : "開啟音效");
    if (soundEnabled) playTone(600, .08);
  });

  saveStats();
  render();
})();
