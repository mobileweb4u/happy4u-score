// --- State Management ---
let matchHistory = []; 
let totalFramesPlayed = 0; 
let activeScoringPlayer = null; 
const APP_VERSION = "3.8.0"; 
const MATCH_ID = "MATCH-" + Date.now(); 

// Profiles added for the League Match Hall of Fame
let playerProfiles = JSON.parse(localStorage.getItem('happy4u_profiles')) || {};
// NEW: Tracks Head-to-Head rivalry stats
let rivalryHistory = JSON.parse(localStorage.getItem('happy4u_rivalries')) || {};

let gameState = {
    p1Name: "PLAYER 1",
    p2Name: "PLAYER 2",
    p1Score: 0,
    p2Score: 0,
    p1Matches: 0,
    p2Matches: 0,
    p1GoldenBreaks: 0, 
    p1Dishes: 0,
    p1RevDishes: 0,
    p2GoldenBreaks: 0, 
    p2Dishes: 0,
    p2RevDishes: 0,
    raceTo: 3,
    lagWinner: null,
    startTime: null,
    isFinished: false 
};

// --- PERSISTENCE: SAVE & LOAD ---
function saveData() {
    const data = { gameState, matchHistory, totalFramesPlayed };
    localStorage.setItem('happy4u_data', JSON.stringify(data));
    localStorage.setItem('happy4u_profiles', JSON.stringify(playerProfiles));
    localStorage.setItem('happy4u_rivalries', JSON.stringify(rivalryHistory));
}

function loadData() {
    const saved = localStorage.getItem('happy4u_data');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(gameState, parsed.gameState);
        matchHistory = parsed.matchHistory;
        totalFramesPlayed = parsed.totalFramesPlayed;
        return true;
    }
    return false;
}

// --- DOM Elements ---
const setupModal = document.getElementById('setup-modal');
const lagModal = document.getElementById('lag-modal');
const dishModal = document.getElementById('dish-modal');
const winnerModal = document.getElementById('winner-modal');
const tickerElement = document.getElementById('news-ticker');
const infoModal = document.getElementById('info-modal');
const infoIcon = document.querySelector('.info-icon');
const reportViewModal = document.getElementById('report-view-modal');
const reportTextArea = document.getElementById('report-text-area');
const aboutModal = document.getElementById('about-modal');

// --- ORIENTATION FIX ---
window.addEventListener('resize', () => {
    updateUI(); 
});

// --- 1. Match Setup Logic ---
document.getElementById('save-setup-btn').addEventListener('click', () => {
    gameState.p1Name = (document.getElementById('p1-input').value || "PLAYER 1").toUpperCase();
    gameState.p2Name = (document.getElementById('p2-input').value || "PLAYER 2").toUpperCase();
    
    initProfile(gameState.p1Name);
    initProfile(gameState.p2Name);

    gameState.raceTo = parseInt(document.getElementById('race-input').value) || 3;
    gameState.startTime = new Date();

    const isGoldenActive = document.getElementById('goldenBreakActive').checked;
    localStorage.setItem('goldenBreakEnabled', isGoldenActive);

    document.getElementById('race-goal-display').innerText = (gameState.raceTo === 12) ? "9 (LEAGUE)" : gameState.raceTo;
    document.getElementById('p1-name-display').innerText = gameState.p1Name;
    document.getElementById('p2-name-display').innerText = gameState.p2Name;
    document.getElementById('lag-p1-btn').innerText = gameState.p1Name;
    document.getElementById('lag-p2-btn').innerText = gameState.p2Name;

    setupModal.style.display = 'none';
    lagModal.style.display = 'flex';
    
    updateUI();
    updateTicker(`SETTING UP: ${gameState.p1Name} VS ${gameState.p2Name}`);
});

function initProfile(name) {
    if (!playerProfiles[name]) {
        playerProfiles[name] = { 
            matchesWon: 0, 
            matchesLost: 0, 
            totalDishes: 0, 
            totalGoldenBreaks: 0, 
            totalRevDishes: 0, 
            framesWon: 0, 
            draws: 0,
            history: [] 
        };
    }
}

function updateRivalryStats(p1, p2, winnerName) {
    const pair = [p1, p2].sort();
    const rivalryKey = `${pair[0]}_vs_${pair[1]}`;

    if (!rivalryHistory[rivalryKey]) {
        rivalryHistory[rivalryKey] = { 
            [pair[0]]: 0, 
            [pair[1]]: 0, 
            draws: 0, 
            trend: [],
            dishes: { [pair[0]]: 0, [pair[1]]: 0 },
            revDishes: { [pair[0]]: 0, [pair[1]]: 0 },
            goldenBreaks: { [pair[0]]: 0, [pair[1]]: 0 }
        };
    }
    
    if (!rivalryHistory[rivalryKey].trend) rivalryHistory[rivalryKey].trend = [];
    if (!rivalryHistory[rivalryKey].dishes) rivalryHistory[rivalryKey].dishes = { [pair[0]]: 0, [pair[1]]: 0 };
    if (!rivalryHistory[rivalryKey].revDishes) rivalryHistory[rivalryKey].revDishes = { [pair[0]]: 0, [pair[1]]: 0 };
    if (!rivalryHistory[rivalryKey].goldenBreaks) rivalryHistory[rivalryKey].goldenBreaks = { [pair[0]]: 0, [pair[1]]: 0 };

    if (winnerName) {
        rivalryHistory[rivalryKey][winnerName]++;
        rivalryHistory[rivalryKey].trend.unshift({ winner: winnerName });
    } else {
        rivalryHistory[rivalryKey].draws++;
        rivalryHistory[rivalryKey].trend.unshift({ winner: 'DRAW' });
    }
    
    rivalryHistory[rivalryKey].dishes[p1] += (p1 === gameState.p1Name ? gameState.p1Dishes : gameState.p2Dishes);
    rivalryHistory[rivalryKey].dishes[p2] += (p2 === gameState.p1Name ? gameState.p1Dishes : gameState.p2Dishes);
    rivalryHistory[rivalryKey].revDishes[p1] += (p1 === gameState.p1Name ? gameState.p1RevDishes : gameState.p2RevDishes);
    rivalryHistory[rivalryKey].revDishes[p2] += (p2 === gameState.p1Name ? gameState.p1RevDishes : gameState.p2RevDishes);
    rivalryHistory[rivalryKey].goldenBreaks[p1] += (p1 === gameState.p1Name ? gameState.p1GoldenBreaks : gameState.p2GoldenBreaks);
    rivalryHistory[rivalryKey].goldenBreaks[p2] += (p2 === gameState.p1Name ? gameState.p1GoldenBreaks : gameState.p2GoldenBreaks);

    if (rivalryHistory[rivalryKey].trend.length > 5) rivalryHistory[rivalryKey].trend.pop();
}

function updateCareerStats(winnerName, loserName, isDraw = false) {
    const recordResult = (pName, result, score, opponent) => {
        if (!playerProfiles[pName].history) playerProfiles[pName].history = [];
        playerProfiles[pName].history.unshift({ 
            result, 
            score, 
            opponent, 
            date: new Date().toLocaleDateString() 
        });
        if (playerProfiles[pName].history.length > 5) playerProfiles[pName].history.pop();
    };

    updateRivalryStats(gameState.p1Name, gameState.p2Name, isDraw ? null : winnerName);

    if (isDraw) {
        playerProfiles[gameState.p1Name].draws++;
        playerProfiles[gameState.p2Name].draws++;
        recordResult(gameState.p1Name, "DRAW", `${gameState.p1Score}-${gameState.p2Score}`, gameState.p2Name);
        recordResult(gameState.p2Name, "DRAW", `${gameState.p2Score}-${gameState.p1Score}`, gameState.p1Name);
    } else {
        if(playerProfiles[winnerName]) {
            playerProfiles[winnerName].matchesWon++;
            const winScore = winnerName === gameState.p1Name ? `${gameState.p1Score}-${gameState.p2Score}` : `${gameState.p2Score}-${gameState.p1Score}`;
            recordResult(winnerName, "WIN", winScore, loserName);
        }
        if(playerProfiles[loserName]) {
            playerProfiles[loserName].matchesLost++;
            const lossScore = loserName === gameState.p1Name ? `${gameState.p1Score}-${gameState.p2Score}` : `${gameState.p2Score}-${gameState.p1Score}`;
            recordResult(loserName, "LOSS", lossScore, winnerName);
        }
    }
    playerProfiles[gameState.p1Name].framesWon += gameState.p1Score;
    playerProfiles[gameState.p2Name].framesWon += gameState.p2Score;
    
    playerProfiles[gameState.p1Name].totalDishes += gameState.p1Dishes;
    playerProfiles[gameState.p1Name].totalGoldenBreaks += gameState.p1GoldenBreaks;
    playerProfiles[gameState.p1Name].totalRevDishes += gameState.p1RevDishes;
    playerProfiles[gameState.p2Name].totalDishes += gameState.p2Dishes;
    playerProfiles[gameState.p2Name].totalGoldenBreaks += gameState.p2GoldenBreaks;
    playerProfiles[gameState.p2Name].totalRevDishes += gameState.p2RevDishes;

    saveData();
}

// --- 2. Lag Logic ---
document.getElementById('lag-p1-btn').addEventListener('click', () => startMatch('p1'));
document.getElementById('lag-p2-btn').addEventListener('click', () => startMatch('p2'));

function startMatch(winner) {
    gameState.lagWinner = winner;
    lagModal.style.display = 'none';
    updateBreakIndicator();
    updateTicker(`MATCH STARTED! ${gameState[winner+'Name']} WON THE LAG.`);
}

// --- 3. Break/Turn Indicator ---
function updateBreakIndicator() {
    const p1Dot = document.getElementById('p1-break-indicator');
    const p2Dot = document.getElementById('p2-break-indicator');
    if (!gameState.lagWinner || !p1Dot || !p2Dot) return;
    const isP1Turn = (totalFramesPlayed % 2 === 0) ? (gameState.lagWinner === 'p1') : (gameState.lagWinner !== 'p1');
    p1Dot.style.visibility = isP1Turn ? 'visible' : 'hidden';
    p2Dot.style.visibility = isP1Turn ? 'hidden' : 'visible';
}

// --- 4. Scoring Logic ---
document.querySelectorAll('.btn-plus').forEach(btn => {
    btn.addEventListener('click', () => {
        activeScoringPlayer = btn.dataset.player;
        const gbOption = document.querySelector('.dish-option[data-type="golden-break"]');
        if (gbOption) {
            const isGoldenActive = localStorage.getItem('goldenBreakEnabled') === 'true';
            gbOption.style.display = isGoldenActive ? 'block' : 'none';
        }
        dishModal.style.display = 'flex';
    });
});

document.querySelectorAll('.dish-option').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const p = activeScoringPlayer;
        const winnerName = gameState[p + 'Name'];
        recordFrame(winnerName, type);

        if (type === 'golden-break') gameState[p + 'GoldenBreaks']++;
        else if (type === 'break-dish') gameState[p + 'Dishes']++;
        else if (type === 'reverse-dish') gameState[p + 'RevDishes']++;

        gameState[p + 'Score']++;
        totalFramesPlayed++;
        
        saveData(); 
        dishModal.style.display = 'none';
        updateUI();
        updateBreakIndicator();
        let newsEvent = `${winnerName} ${type === 'normal' ? 'WON THE FRAME' : type.replace('-', ' ').toUpperCase() + '!'}`;
        checkWinner(newsEvent);
    });
});

document.getElementById('cancel-dish-btn').addEventListener('click', () => {
    dishModal.style.display = 'none';
});

// --- 5. Winner Logic ---
function checkWinner(newsEvent) {
    const p1 = gameState.p1Score;
    const p2 = gameState.p2Score;

    if (gameState.raceTo === 12) {
        if (p1 === 9) { gameState.p1Matches++; return showWinner(gameState.p1Name); }
        if (p2 === 9) { gameState.p2Matches++; return showWinner(gameState.p2Name); }
        if (totalFramesPlayed === 12) {
            if (p1 > p2) { gameState.p1Matches++; return showWinner(gameState.p1Name); }
            if (p2 > p1) { gameState.p2Matches++; return showWinner(gameState.p2Name); }
            if (p1 === p2) return showDraw();
        }
    } else {
        if (p1 >= gameState.raceTo) {
            gameState.p1Matches++;
            showWinner(gameState.p1Name);
        } else if (p2 >= gameState.raceTo) {
            gameState.p2Matches++;
            showWinner(gameState.p2Name);
        } else {
            updateTicker(newsEvent);
        }
    }
    updateTicker(newsEvent);
}

function showWinner(name) {
    if (!gameState.isFinished) {
        let loser = (name === gameState.p1Name) ? gameState.p2Name : gameState.p1Name;
        updateCareerStats(name, loser, false);
    }
    gameState.isFinished = true; 
    saveData();
    const winText = document.getElementById('winner-text');
    winText.innerHTML = `CONGRATULATIONS FINISH <span style="color:var(--neon-magenta);">${name}</span><br>` +
                        `<small style="font-size: 0.7em; color: white;">FINAL SCORE: ${gameState.p1Score}-${gameState.p2Score}</small>`;
    
    const reportBtn = document.getElementById('view-report-btn');
    const againBtn = document.getElementById('again-race-btn');
    if (reportBtn && againBtn) {
        againBtn.parentNode.insertBefore(reportBtn, againBtn);
        reportBtn.style.display = "block";
        reportBtn.style.flex = "1";
    }
    winnerModal.style.display = 'flex';
    updateTicker(`CHAMPION: ${name} WINS THE MATCH!`);
}

function showDraw() {
    if (!gameState.isFinished) updateCareerStats(null, null, true);
    gameState.isFinished = true;
    saveData();
    const winText = document.getElementById('winner-text');
    winText.innerHTML = `<span style="color:var(--neon-cyan);">MATCH DRAWN (6-6)</span><br>` +
                        `<small style="font-size: 0.7em; color: white;">LEAGUE POINTS SPLIT</small>`;
    
    const reportBtn = document.getElementById('view-report-btn');
    const againBtn = document.getElementById('again-race-btn');
    if (reportBtn && againBtn) {
        againBtn.parentNode.insertBefore(reportBtn, againBtn);
        reportBtn.style.display = "block";
    }
    winnerModal.style.display = 'flex';
    updateTicker(`LEAGUE ALERT: MATCH ENDED IN A DRAW!`);
}

// --- 6. UNDO LOGIC ---
function undoLastFrame() {
    if (matchHistory.length === 0) return alert("No frames to undo!");
    if (confirm("Undo the last recorded frame?")) {
        const lastFrame = matchHistory.pop();
        totalFramesPlayed--;
        const pKey = (lastFrame.winner === gameState.p1Name) ? 'p1' : 'p2';
        gameState[pKey + 'Score']--;
        gameState.isFinished = false; 
        if (lastFrame.type === 'golden-break') gameState[pKey + 'GoldenBreaks']--;
        else if (lastFrame.type === 'break-dish') gameState[pKey + 'Dishes']--;
        else if (lastFrame.type === 'reverse-dish') gameState[pKey + 'RevDishes']--;
        saveData(); 
        winnerModal.style.display = 'none';
        updateUI();
        updateBreakIndicator();
        updateTicker(`UNDO: LAST FRAME REMOVED. SCORE: ${gameState.p1Score}-${gameState.p2Score}`);
        refreshHistoryModal();
    }
}

const undoBtn = document.getElementById('undo-btn');
if (undoBtn) undoBtn.addEventListener('click', undoLastFrame);

// --- 7. Navigation / Reset ---
document.getElementById('again-race-btn').addEventListener('click', () => {
    gameState.p1Score = 0;
    gameState.p2Score = 0;
    gameState.isFinished = false; 
    winnerModal.style.display = 'none';
    updateUI();
    updateBreakIndicator();
    updateTicker("NEW RACE STARTED!");
});

document.getElementById('new-race-btn').addEventListener('click', () => {
    localStorage.removeItem('happy4u_data');
    location.reload();
});

document.querySelectorAll('.end-game').forEach(btn => {
    btn.addEventListener('click', () => {
        if(confirm("End current match and reset everything?")) {
            localStorage.removeItem('happy4u_data');
            location.reload();
        }
    });
});

// --- 8. UI Update Helpers ---
function updateUI() {
    const safeUpdate = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };
    safeUpdate('p1-score', gameState.p1Score);
    safeUpdate('p2-score', gameState.p2Score);
    safeUpdate('p1-matches', gameState.p1Matches);
    safeUpdate('p2-matches', gameState.p2Matches);
    const isGoldenActive = localStorage.getItem('goldenBreakEnabled') === 'true';
    safeUpdate('p1-golden-breaks', gameState.p1GoldenBreaks);
    safeUpdate('p2-golden-breaks', gameState.p2GoldenBreaks);
    safeUpdate('p1-dishes', gameState.p1Dishes);
    safeUpdate('p1-rev-dishes', gameState.p1RevDishes);
    safeUpdate('p2-dishes', gameState.p2Dishes);
    safeUpdate('p2-rev-dishes', gameState.p2RevDishes);
    
    const goldenRows = document.querySelectorAll('.golden-break-row');
    goldenRows.forEach(row => {
        row.style.display = isGoldenActive ? 'block' : 'none';
    });
}

function updateTicker(message) {
    if (!tickerElement) return;
    const isLeague = (gameState.raceTo === 12);
    const raceToHighlight = `RULE: <span class="ticker-highlight">${isLeague ? 'LEAGUE (9-WIN / MAX 12)' : 'RACE TO ' + gameState.raceTo}</span>`;
    const liveScore = `LIVE SCORE: ${gameState.p1Name} (${gameState.p1Score}) - ${gameState.p2Name} (${gameState.p2Score})`;
    const isGoldenActive = localStorage.getItem('goldenBreakEnabled') === 'true';
    const gbP1 = isGoldenActive ? ` | GB: ${gameState.p1GoldenBreaks}` : '';
    const gbP2 = isGoldenActive ? ` | GB: ${gameState.p2GoldenBreaks}` : '';
    const p1Stats = `${gameState.p1Name} [D: ${gameState.p1Dishes} | R: ${gameState.p1RevDishes}${gbP1}]`;
    const p2Stats = `${gameState.p2Name} [D: ${gameState.p2Dishes} | R: ${gameState.p2RevDishes}${gbP2}]`;
    const racesWon = `RACES WON: ${gameState.p1Name} (${gameState.p1Matches}) - ${gameState.p2Name} (${gameState.p2Matches})`;
    tickerElement.innerHTML = `<span>NEWS FLASH:</span> ${message.toUpperCase()} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ${raceToHighlight} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ${liveScore} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ${p1Stats} | ${p2Stats} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ${racesWon}`;
}

// --- 9. Menu & Summary Logic ---
if (infoIcon) {
    infoIcon.addEventListener('click', () => {
        infoModal.style.display = 'flex';
        addBackupButtons(); 
    });
}
document.getElementById('close-info-btn').addEventListener('click', () => infoModal.style.display = 'none');

/**
 * UPDATED FUNCTION: addBackupButtons
 * Matches Image 2 UI with a Grid Layout and Live Data Badges
 */
function addBackupButtons() {
    const infoContent = infoModal.querySelector('.modal-content');
    
    // Clear any old containers first to avoid duplicates
    const oldContainer = document.getElementById('backup-btn-container');
    if (oldContainer) oldContainer.remove();

    // Create the Main Menu Grid (Matches Image 2)
    const container = document.createElement('div');
    container.id = 'backup-btn-container';
    container.className = 'main-menu-grid-container'; 
    container.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;";

    // Helper to create the large icon buttons with subtext badges
    const createMenuBtn = (text, icon, color, action, badgeText = "", className = "") => {
        const btn = document.createElement('button');
        btn.className = `menu-btn ${className}`;
        btn.innerHTML = `
            <div style="font-size:2rem; margin-bottom:5px;">${icon}</div>
            <div style="font-size:0.75rem; font-weight:900;">${text}</div>
            ${badgeText ? `<div style="font-size:0.55rem; color:${color}; margin-top:5px; opacity:0.8; font-weight:bold;">${badgeText}</div>` : ''}
        `;
        btn.style.cssText = `background: rgba(255,255,255,0.05); color: white; border: 1px solid #333; border-radius: 12px; padding: 20px; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden;`;
        
        btn.onmouseover = () => { 
            btn.style.borderColor = color; 
            btn.style.boxShadow = `0 0 15px ${color}66`; 
            btn.style.background = "rgba(255,255,255,0.08)";
        };
        btn.onmouseout = () => { 
            btn.style.borderColor = "#333"; 
            btn.style.boxShadow = "none"; 
            btn.style.background = "rgba(255,255,255,0.05)";
        };
        btn.onclick = action;
        return btn;
    };

    // Calculate dynamic badge data
    const sortedPlayers = Object.keys(playerProfiles).sort((a,b) => playerProfiles[b].matchesWon - playerProfiles[a].matchesWon);
    const topPlayer = sortedPlayers.length > 0 ? sortedPlayers[0] : "NO DATA";
    const lastBackup = localStorage.getItem('happy4u_last_backup') || "NEVER";

    // 1. League Match (Primary Action)
    const leagueBtn = createMenuBtn("LEAGUE MATCH", "🏆", "var(--neon-cyan)", () => {
        infoModal.style.display = 'none';
        setupModal.style.display = 'flex';
    }, "START NEW RACE", "league-btn");

    // 2. Practice Drills
    const drillsBtn = createMenuBtn("PRACTICE DRILLS", "🎱", "var(--neon-magenta)", () => {
        infoModal.style.display = 'none';
        drillModal.style.display = 'flex';
        showDrill(0);
    }, `${drillImages.length} DRILLS LOADED`);

    // 3. Hall of Fame (Shows current #1 player)
    const fameBtn = createMenuBtn("HALL OF FAME", "👑", "#FFD700", () => {
        infoModal.style.display = 'none';
        openHallOfFame(); 
    }, `TOP RANK: ${topPlayer}`);

    // 4. Cloud Backup (Shows last backup time)
    const backupBtn = createMenuBtn("CLOUD BACKUP", "☁️", "var(--neon-blue)", () => {
        exportData();
        localStorage.setItem('happy4u_last_backup', new Date().toLocaleDateString());
        addBackupButtons(); // Refresh UI to show new date
    }, `LAST: ${lastBackup}`);

    // Append all to grid
    container.appendChild(leagueBtn);
    container.appendChild(drillsBtn);
    container.appendChild(fameBtn);
    container.appendChild(backupBtn);
    
    infoContent.appendChild(container);
}

function recordFrame(winnerName, type) {
    matchHistory.push({
        frame: totalFramesPlayed + 1,
        winner: winnerName,
        type: type
    });
}

function refreshHistoryModal() {
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    const modalContent = historyModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.maxWidth = "1200px";
        modalContent.style.width = "95vw";
    }
    historyList.style.display = "flex";
    historyList.style.flexDirection = "column";
    let p1FrameF = 0, p1FrameA = 0;
    let p2FrameF = 0, p2FrameA = 0;
    matchHistory.forEach(f => {
        if (f.winner === gameState.p1Name) { p1FrameF++; p2FrameA++; }
        else { p2FrameF++; p1FrameA++; }
    });
    const isLeague = (gameState.raceTo === 12);
    const typeColor = isLeague ? "var(--neon-cyan)" : "#fff"; 
    const statusColor = gameState.isFinished ? "var(--neon-magenta)" : "var(--neon-green)";
    const statusText = gameState.isFinished ? "FINISHED ✅" : "IN PROGRESS 🏃";
    const isGoldenActive = localStorage.getItem('goldenBreakEnabled') === 'true';
    let terminalOutput = `<span style="color: #fff;">╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗</span>\n║                                     HAPPY4U MATCH REPORT PREVIEW                                         ║\n╚══════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n\n  DATE:     ${new Date().toLocaleString()}\n  TYPE:     <span style="color: ${typeColor};">${isLeague ? 'LEAGUE SPECIAL (9-WIN)' : 'STANDARD RACE TO ' + gameState.raceTo}</span>\n  STATUS:   <span style="color: ${statusColor};">${statusText}</span>\n  SCORE:    <span style="color: var(--neon-blue); font-weight: bold;">${gameState.p1Name} (${gameState.p1Score}) - ${gameState.p2Name} (${gameState.p2Score})</span>\n  <span style="color: #444;">----------------------------------------------------------------------------------------------------------</span>\n  <span style="color: #aaa; text-decoration: underline;">PLAYER STATISTICS:</span>\n  <span style="color: var(--neon-blue);">${gameState.p1Name.padEnd(20)}</span> | DISHES: ${gameState.p1Dishes} | REV: ${gameState.p1RevDishes}${isGoldenActive ? ' | GOLDEN: ' + gameState.p1GoldenBreaks : ''}\n  ${"".padEnd(20)} | FRAME-F: ${p1FrameF} | FRAME-A: ${p1FrameA}\n  <span style="color: #222;">..........................................................................................................</span>\n  <span style="color: var(--neon-blue);">${gameState.p2Name.padEnd(20)}</span> | DISHES: ${gameState.p2Dishes} | REV: ${gameState.p2RevDishes}${isGoldenActive ? ' | GOLDEN: ' + gameState.p2GoldenBreaks : ''}\n  ${"".padEnd(20)} | FRAME-F: ${p2FrameF} | FRAME-A: ${p2FrameA}\n  <span style="color: #444;">----------------------------------------------------------------------------------------------------------</span>\n\n  <span style="color: #aaa; text-decoration: underline;">MATCH PROGRESS LOG:</span>\n`;
    if (matchHistory.length === 0) {
        terminalOutput += `  <span style="color: #666;">> No frames recorded yet.</span>\n`;
    } else {
        matchHistory.slice().reverse().forEach((item) => {
            const frameNum = `FRAME ${item.frame}`.padEnd(12);
            const winner = item.winner.padEnd(20);
            const tText = item.type.replace('-', ' ').toUpperCase();
            const tColor = (item.type !== 'normal') ? "var(--neon-cyan)" : "#fff";
            terminalOutput += `  [✔] ${frameNum} | WINNER: <span style="color: var(--neon-green);">${winner}</span> | TYPE: <span style="color: ${tColor};">${tText}</span>\n`;
        });
    }
    terminalOutput += `\n  <span style="color: #444;">__________________________________________________________________________________________________________</span>\n                             <span style="color: #555;">GENERATED BY Freddie Russell</span>          `;
    historyList.innerHTML = `<div style="font-family: 'Courier New', monospace; white-space: pre; background: #000; color: #fff; padding: 25px; border-radius: 8px; font-size: 1rem; height: 75vh; max-height: 800px; overflow-y: auto; border: 2px solid #222; box-shadow: inset 0 0 15px #000; margin-bottom: 15px; box-sizing: border-box;">${terminalOutput}</div>`;
    
    const btnContainer = document.createElement('div');
    btnContainer.style.display = "flex";
    btnContainer.style.gap = "15px";
    btnContainer.style.width = "100%";
    btnContainer.style.marginTop = "auto";
    const undoBtnOriginal = document.getElementById('undo-btn');
    const backBtnOriginal = document.getElementById('close-history-btn');
    if (undoBtnOriginal && backBtnOriginal) {
        undoBtnOriginal.style.display = "block"; 
        backBtnOriginal.style.display = "block";
        const btnStyles = "flex: 1; margin: 0; padding: 15px; font-size: 1rem; cursor: pointer; border-radius: 5px; font-weight: bold;";
        undoBtnOriginal.style.cssText += btnStyles + "box-shadow: 0 0 10px rgba(255, 165, 0, 0.3);"; 
        backBtnOriginal.style.cssText += btnStyles;
        const summaryBtn = document.createElement('button');
        summaryBtn.innerText = "SUMMARY";
        summaryBtn.style.cssText = btnStyles + "background: var(--neon-blue); color: white; border: 1px solid var(--neon-blue); box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);";
        summaryBtn.onclick = () => { reportTextArea.innerText = generateReportText(); reportViewModal.style.display = 'flex'; };
        btnContainer.appendChild(undoBtnOriginal);
        btnContainer.appendChild(summaryBtn);
        btnContainer.appendChild(backBtnOriginal);
        historyList.appendChild(btnContainer);
    }
}

document.getElementById('open-history-btn').addEventListener('click', () => { infoModal.style.display = 'none'; document.getElementById('history-modal').style.display = 'flex'; refreshHistoryModal(); });
document.getElementById('close-history-btn').addEventListener('click', () => { document.getElementById('history-modal').style.display = 'none'; infoModal.style.display = 'flex'; });

function generateReportText() {
    const now = new Date();
    const durationText = gameState.startTime ? new Date(Math.abs(now - gameState.startTime)).toISOString().substr(11, 8) : "00:00:00";
    const isGoldenActive = localStorage.getItem('goldenBreakEnabled') === 'true';
    let p1FrameF = 0, p1FrameA = 0;
    let p2FrameF = 0, p2FrameA = 0;
    matchHistory.forEach(f => {
        if (f.winner === gameState.p1Name) { p1FrameF++; p2FrameA++; }
        else { p2FrameF++; p1FrameA++; }
    });
    let report = `╔═════════════════════════════════════════════════════╗\n║                HAPPY4U MATCH REPORT                 ║\n╚═════════════════════════════════════════════════════╝\n\n  DATE:     ${now.toLocaleString()}\n  MATCH ID: ${MATCH_ID}\n  TYPE:     ${gameState.raceTo === 12 ? 'LEAGUE (9-WIN/12-MAX)' : 'RACE TO ' + gameState.raceTo}\n  STATUS:   ${gameState.isFinished ? "FINISHED ✅" : "IN PROGRESS 🏃"}\n  DURATION: ${durationText}\n  ------------------------------------------------------\n  SCORE:    ${gameState.p1Name} (${gameState.p1Score}) - ${gameState.p2Name} (${gameState.p2Score})\n  ------------------------------------------------------\n  PLAYER STATISTICS:\n  ${gameState.p1Name.padEnd(15)} | DISHES: ${gameState.p1Dishes} | REV: ${gameState.p1RevDishes}${isGoldenActive ? ' | GOLDEN: ' + gameState.p1GoldenBreaks : ''}\n  ${gameState.p1Name.padEnd(15)} | FRAME-F: ${p1FrameF} | FRAME-A: ${p1FrameA}\n  ${gameState.p2Name.padEnd(15)} | DISHES: ${gameState.p2Dishes} | REV: ${gameState.p2RevDishes}${isGoldenActive ? ' | GOLDEN: ' + gameState.p2GoldenBreaks : ''}\n  ${gameState.p2Name.padEnd(15)} | FRAME-F: ${p2FrameF} | FRAME-A: ${p2FrameA}\n  ------------------------------------------------------\n\n  MATCH LOG:\n`;
    matchHistory.forEach((item) => { report += `  [✔] FRAME ${String(item.frame).padEnd(2)} | WINNER: ${item.winner.padEnd(15)} | ${item.type.toUpperCase()}\n`; });
    report += `\n  ______________________________________________________\n            GENERATED BY Freddie Russell          `;
    return report;
}

document.getElementById('save-match-btn').addEventListener('click', () => {
    const blob = new Blob([generateReportText()], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Match_Report_${MATCH_ID}.txt`;
    link.click();
});
document.getElementById('view-report-btn').addEventListener('click', () => { reportTextArea.innerText = generateReportText(); reportViewModal.style.display = 'flex'; });
document.getElementById('copy-report-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(generateReportText());
    const btn = document.getElementById('copy-report-btn');
    btn.innerText = "✅ COPIED!";
    setTimeout(() => btn.innerText = "COPY REPORT", 2000);
});
document.getElementById('reset-history-btn').addEventListener('click', () => {
    if (confirm("Clear history?")) {
        matchHistory = []; totalFramesPlayed = 0;
        gameState.p1Score = 0; gameState.p2Score = 0;
        gameState.p1Matches = 0; gameState.p2Matches = 0;
        gameState.isFinished = false;
        saveData(); updateUI();
        reportTextArea.innerText = generateReportText();
    }
});
document.getElementById('close-report-view').addEventListener('click', () => { reportViewModal.style.display = 'none'; });

const drillImages = ["Drill/drill1.png", "Drill/drill2.png", "Drill/drill3.png", "Drill/drill4.png", "Drill/drill5.png", "Drill/drill6.png", "Drill/drill7.png", "Drill/drill8.png", "Drill/drill9.png"]; 
let currentDrillIndex = 0;
const drillModal = document.getElementById('drill-modal');
const drillDisplay = document.getElementById('drill-display');
const drillName = document.getElementById('drill-name');

document.getElementById('open-drills-btn').addEventListener('click', () => { infoModal.style.display = 'none'; drillModal.style.display = 'flex'; showDrill(0); });
function showDrill(index) { currentDrillIndex = index; drillDisplay.src = drillImages[index]; drillName.innerText = drillImages[index].replace('Drill/', '').replace('.png', '').toUpperCase(); }
document.getElementById('next-drill').addEventListener('click', () => { currentDrillIndex = (currentDrillIndex + 1) % drillImages.length; showDrill(currentDrillIndex); });
document.getElementById('prev-drill').addEventListener('click', () => { currentDrillIndex = (currentDrillIndex - 1 + drillImages.length) % drillImages.length; showDrill(currentDrillIndex); });
document.getElementById('close-drills').addEventListener('click', () => { drillModal.style.display = 'none'; });

function exportData() {
    const backup = { playerProfiles, rivalryHistory, exportDate: new Date().toISOString(), appName: "Happy4U Scoreboard" };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Happy4U_Cloud_Backup_${new Date().toLocaleDateString()}.json`;
    link.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.playerProfiles) {
                    playerProfiles = imported.playerProfiles;
                    rivalryHistory = imported.rivalryHistory || {};
                    saveData();
                    alert("Import Successful! Reloading app...");
                    window.location.reload();
                } else { alert("Invalid backup file."); }
            } catch (err) { alert("Error reading file."); }
        };
        reader.readAsText(file);
    };
    input.click();
}

async function updateStorageDisplay() {
    if (navigator.storage && navigator.storage.estimate) {
        const {usage} = await navigator.storage.estimate();
        const usageInMB = (usage / (1024 * 1024)).toFixed(2);
        const storageInfo = document.getElementById('storage-info');
        if (storageInfo) storageInfo.innerText = `Storage: ${usageInMB} MB`;
    }
}

// --- UPDATED PROFESSIONAL PLAYER HISTORY MODAL ---
window.viewPlayerHistory = function(name) {
    const p = playerProfiles[name];
    if (!p.history || p.history.length === 0) return alert(`No match history for ${name} yet.`);
    
    let profModal = document.getElementById('prof-history-modal');
    if (!profModal) {
        profModal = document.createElement('div');
        profModal.id = 'prof-history-modal';
        profModal.style.cssText = "display: flex; position: fixed; z-index: 6000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.92); justify-content: center; align-items: center; backdrop-filter: blur(12px); font-family: 'Segoe UI', Roboto, sans-serif;";
        document.body.appendChild(profModal);
    }

    const isGoldenActive = localStorage.getItem('goldenBreakEnabled') === 'true';

    let historyHtml = "";
    p.history.forEach((h, i) => {
        const statusColor = h.result === "WIN" ? "var(--neon-green)" : h.result === "LOSS" ? "var(--neon-magenta)" : "#888";
        const oppLabel = h.opponent ? `VS ${h.opponent}` : "VS OPPONENT";
        
        historyHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border: 1px solid #333; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 5px solid ${statusColor};">
                <div style="flex: 1;">
                    <div style="font-size: 0.7rem; color: #777; margin-bottom: 4px; font-weight: bold; letter-spacing: 1px;">${h.date}</div>
                    <div style="font-weight: 900; color: ${statusColor}; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px;">${h.result}</div>
                    <div style="font-size: 0.85rem; color: #fff; margin-top: 4px; font-weight: bold; text-transform: uppercase;">${oppLabel}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.6rem; font-weight: 900; color: #fff; font-family: 'Courier New', monospace; letter-spacing: -1px; text-shadow: 0 0 10px rgba(255,255,255,0.2);">${h.score}</div>
                </div>
            </div>
        `;
    });

    profModal.innerHTML = `
        <div style="background: #050505; border: 2px solid #222; width: 95%; max-width: 500px; padding: 35px; border-radius: 20px; box-shadow: 0 30px 80px rgba(0,0,0,0.9); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, transparent, #FFD700, transparent);"></div>
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #FFD700; margin: 0; font-size: 2rem; text-transform: uppercase; letter-spacing: 4px; font-weight: 900;">${name}</h2>
                <div style="color: #555; font-size: 0.8rem; margin-top: 8px; font-weight: bold; letter-spacing: 2px;">RECENT PERFORMANCE LOG</div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 25px; background: rgba(255,215,0,0.05); border: 1px solid #222; padding: 15px; border-radius: 12px;">
                <div style="text-align: center;"><div style="color: #666; font-size: 0.6rem; font-weight: 900;">RACES WON</div><div style="color: #FFD700; font-size: 1.2rem; font-weight: 900;">${p.matchesWon}</div></div>
                <div style="text-align: center;"><div style="color: #666; font-size: 0.6rem; font-weight: 900;">BREAK DISHES</div><div style="color: #fff; font-size: 1.2rem; font-weight: 900;">${p.totalDishes || 0}</div></div>
                <div style="text-align: center;"><div style="color: #666; font-size: 0.6rem; font-weight: 900;">REVERSE DISHES</div><div style="color: #fff; font-size: 1.2rem; font-weight: 900;">${p.totalRevDishes || 0}</div></div>
                ${isGoldenActive ? `<div style="text-align: center;"><div style="color: #666; font-size: 0.6rem; font-weight: 900;">GOLDEN BREAKS</div><div style="color: var(--neon-cyan); font-size: 1.2rem; font-weight: 900;">${p.totalGoldenBreaks || 0}</div></div>` : ''}
            </div>

            <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                <div style="color: #444; font-size: 0.7rem; margin-bottom: 15px; text-transform: uppercase; font-weight: bold; letter-spacing: 2px; border-bottom: 1px solid #222; padding-bottom: 8px;">LAST 5 MATCH FORM</div>
                ${historyHtml}
            </div>
            <button onclick="document.getElementById('prof-history-modal').style.display='none'" 
                    style="width: 100%; margin-top: 25px; padding: 22px; background: transparent; border: 2px solid #333; color: #888; border-radius: 12px; cursor: pointer; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; font-size: 0.9rem; transition: all 0.2s;">
                EXIT PERFORMANCE
            </button>
        </div>
    `;
    profModal.style.display = 'flex';
}

// --- UPDATED PROFESSIONAL RIVALRY MODAL ---
window.viewRivalries = function(name) {
    let rivalsFound = false;
    let recordsHtml = "";
    const isGoldenActive = localStorage.getItem('goldenBreakEnabled') === 'true';
    
    let rivModal = document.getElementById('rivalry-modal');
    if (!rivModal) {
        rivModal = document.createElement('div');
        rivModal.id = 'rivalry-modal';
        rivModal.style.cssText = "display: flex; position: fixed; z-index: 7000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.92); justify-content: center; align-items: center; backdrop-filter: blur(12px); font-family: 'Segoe UI', Roboto, sans-serif;";
        document.body.appendChild(rivModal);
    }

    Object.keys(rivalryHistory).forEach(key => {
        if (key.includes(name)) {
            rivalsFound = true;
            const opponent = key.replace(name, '').replace('_vs_', '');
            const stats = rivalryHistory[key];
            const total = stats[name] + stats[opponent] + (stats.draws || 0);
            const winPct = total > 0 ? Math.round((stats[name] / total) * 100) : 0;

            let trendHtml = "";
            if (stats.trend && stats.trend.length > 0) {
                stats.trend.slice(0, 3).forEach(t => {
                    let color = "#444"; let label = "D";
                    if (t.winner === name) { color = "var(--neon-green)"; label = "W"; }
                    else if (t.winner === opponent) { color = "var(--neon-magenta)"; label = "L"; }
                    trendHtml += `<span style="background:${color}; color:#000; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; border-radius:4px; font-size:0.75rem; font-weight:900; margin-left:6px; box-shadow: 0 0 8px ${color}66;">${label}</span>`;
                });
            }

            recordsHtml += `
                <div style="background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border: 1px solid #333; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 5px solid #FFD700;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <div>
                            <span style="color: var(--neon-cyan); font-weight: 900; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 1px;">vs ${opponent}</span>
                            <div style="font-size: 0.7rem; color: #888; margin-top: 6px; font-weight: bold; letter-spacing: 1px;">RECENT FORM: ${trendHtml || 'N/A'}</div>
                        </div>
                        <div style="text-align: right;">
                            <span style="background: #FFD700; color: #000; padding: 5px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 900; box-shadow: 0 0 15px rgba(255,215,0,0.3);">${winPct}% WIN RATE</span>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center; margin-bottom: 15px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                        <div><div style="font-size: 0.6rem; color: #666; font-weight: 900;">RIVALRY WINS</div><div style="font-size: 1.3rem; color: #fff; font-weight: 900;">${stats[name]}</div></div>
                        <div><div style="font-size: 0.6rem; color: #666; font-weight: 900;">DISHES</div><div style="font-size: 1.3rem; color: var(--neon-blue); font-weight: 900;">${(stats.dishes && stats.dishes[name]) || 0}</div></div>
                        <div><div style="font-size: 0.6rem; color: #666; font-weight: 900;">REV DISHES</div><div style="font-size: 1.3rem; color: var(--neon-magenta); font-weight: 900;">${(stats.revDishes && stats.revDishes[name]) || 0}</div></div>
                        ${isGoldenActive ? `<div style="grid-column: span 3; border-top: 1px solid #222; padding-top: 5px; margin-top: 5px;"><div style="font-size: 0.6rem; color: #666; font-weight: 900;">GOLDEN BREAKS IN RIVALRY: <span style="color: var(--neon-cyan); font-size: 0.9rem;">${(stats.goldenBreaks && stats.goldenBreaks[name]) || 0}</span></div></div>` : ''}
                    </div>
                    
                    <div style="height: 8px; background: #111; border-radius: 4px; display: flex; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
                        <div style="width: ${winPct}%; background: var(--neon-blue); height: 100%; box-shadow: 0 0 10px var(--neon-blue);"></div>
                        <div style="width: ${100 - winPct}%; background: var(--neon-magenta); height: 100%; box-shadow: 0 0 10px var(--neon-magenta);"></div>
                    </div>
                </div>`;
        }
    });

    rivModal.innerHTML = `
        <div style="background: #050505; border: 2px solid #222; width: 95%; max-width: 500px; padding: 35px; border-radius: 20px; box-shadow: 0 30px 80px rgba(0,0,0,0.9); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, transparent, #FFD700, transparent);"></div>
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #FFD700; margin: 0; font-size: 1.6rem; text-transform: uppercase; letter-spacing: 5px; font-weight: 900;">HEAD-TO-HEAD</h2>
                <div style="color: var(--neon-green); font-size: 0.8rem; margin-top: 8px; font-weight: bold; letter-spacing: 2px;">OFFICIAL PERFORMANCE METRICS: ${name}</div>
            </div>
            <div style="max-height: 500px; overflow-y: auto; padding-right: 10px;">
                ${rivalsFound ? recordsHtml : '<div style="text-align:center; color:#333; padding: 60px; font-size: 1rem; font-weight: 900; letter-spacing: 1px;">NO DATA RECORDED</div>'}
            </div>
            <button onclick="document.getElementById('rivalry-modal').style.display='none'" 
                    style="width: 100%; margin-top: 30px; padding: 22px; background: #FFD700; border: none; color: #000; border-radius: 12px; cursor: pointer; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; font-size: 0.9rem;">
                EXIT RECORDS
            </button>
        </div>`;
    rivModal.style.display = 'flex';
}

window.openHallOfFame = function() {
    let hofModal = document.getElementById('hall-fame-modal');
    if (!hofModal) {
        hofModal = document.createElement('div');
        hofModal.id = 'hall-fame-modal';
        hofModal.className = 'modal'; 
        hofModal.style.cssText = "display: flex; position: fixed; z-index: 5000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); justify-content: center; align-items: center; backdrop-filter: blur(8px);";
        hofModal.innerHTML = `
            <div class="modal-content" style="border: 2px solid #FFD700; box-shadow: 0 0 30px rgba(255, 215, 0, 0.3); max-width: 650px; width: 95%; background: #0a0a0a; padding: 25px;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="color: #FFD700; text-transform: uppercase; letter-spacing: 3px; margin: 0; font-size: 1.5rem;">🏆 LEAGUE HALL OF FAME</h2>
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, #FFD700, transparent); margin-top: 15px;"></div>
                </div>
                <div id="hof-list-container" style="max-height: 450px; overflow-y: auto; background: rgba(255,255,255,0.02); border-radius: 4px; border: 1px solid #222;">
                    <div style="display: grid; grid-template-columns: 0.4fr 1.5fr 1fr 0.6fr 1.8fr 0.8fr; padding: 12px 10px; border-bottom: 2px solid #333; font-size: 0.65rem; color: #888; font-weight: bold; text-transform: uppercase; text-align: center;">
                        <div>#</div><div style="text-align: left;">PLAYER</div><div>W-L-D</div><div>GB</div><div>LOG</div><div>VS</div>
                    </div>
                    <div id="hof-rows"></div>
                </div>
                <button id="close-hof-btn" style="width: 100%; margin-top: 25px; padding: 18px; background: transparent; border: 1px solid #FFD700; color: #FFD700; font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">CLOSE</button>
            </div>
        `;
        document.body.appendChild(hofModal);
    }
    
    document.getElementById('close-hof-btn').onclick = () => {
        hofModal.style.display = 'none';
    };

    const rowsContainer = document.getElementById('hof-rows');
    const sortedNames = Object.keys(playerProfiles).sort((a,b) => playerProfiles[b].matchesWon - playerProfiles[a].matchesWon);
    let html = "";
    if (sortedNames.length === 0) {
        html = `<p style="text-align:center; color:#555; padding: 30px;">NO LEAGUE DATA RECORDED</p>`;
    } else {
        sortedNames.forEach((name, index) => {
            const p = playerProfiles[name];
            const rankIcon = (index === 0) ? "🥇" : (index === 1) ? "🥈" : (index === 2) ? "🥉" : (index + 1);
            html += `
                <div style="display: grid; grid-template-columns: 0.4fr 1.5fr 1fr 0.6fr 1.8fr 0.8fr; padding: 15px 10px; border-bottom: 1px solid #1a1a1a; align-items: center; text-align: center;">
                    <div style="font-weight: bold; color: #FFD700; font-size: 0.8rem;">${rankIcon}</div>
                    <div style="text-align: left; color: var(--neon-blue); font-weight: bold; font-size: 0.8rem;">${name}</div>
                    <div style="font-family: monospace; color: #aaa; font-size: 0.8rem;">${p.matchesWon}-${p.matchesLost}-${p.draws || 0}</div>
                    <div style="color: #FFD700; font-family: monospace; font-size: 0.8rem;">${p.totalGoldenBreaks || 0}</div>
                    <div style="display: flex; gap: 5px; justify-content: center; padding: 0 5px;">
                        <button onclick="viewPlayerHistory('${name}')" style="background:transparent; border:1px solid #444; color:#fff; font-size:0.55rem; padding:5px 0; cursor:pointer; flex: 1; border-radius: 3px;">LAST 5</button>
                        <button onclick="viewRivalries('${name}')" style="background:transparent; border:1px solid #444; color:#fff; font-size:0.55rem; padding:5px 0; cursor:pointer; flex: 1; border-radius: 3px;">VIEW</button>
                    </div>
                    <div><button onclick="viewRivalries('${name}')" style="background:transparent; border:1px solid var(--neon-blue); color:var(--neon-blue); font-size:0.6rem; padding:5px; cursor:pointer; font-weight:bold; width: 100%; border-radius: 3px;">RIVALS</button></div>
                </div>`;
        });
    }
    rowsContainer.innerHTML = html;
    hofModal.style.display = 'flex';
}

// --- GLOBAL EVENT LISTENERS ---

document.getElementById('open-about-btn').addEventListener('click', () => {
    infoModal.style.display = 'none';
    aboutModal.style.display = 'flex';
    updateStorageDisplay();
});

document.getElementById('close-about-btn').addEventListener('click', () => {
    aboutModal.style.display = 'none';
    infoModal.style.display = 'flex';
});

const factoryBtn = document.getElementById('factory-reset-btn');
if (factoryBtn) {
    factoryBtn.addEventListener('click', async () => {
        if (confirm("Wipe all data?")) {
            localStorage.clear();
            window.location.reload();
        }
    });
}

window.addEventListener('load', () => {
    loadData(); 
    updateUI();
    updateBreakIndicator();
    updateStorageDisplay();
});

const exitSetupBtn = document.getElementById('exit-setup-btn');
if (exitSetupBtn) {
    exitSetupBtn.addEventListener('click', () => {
        if(confirm("Exit match setup?")) {
            localStorage.removeItem('happy4u_data');
            window.location.reload();
        }
    });
}

const qrModal = document.getElementById('qr-modal');
const qrImage = document.getElementById('qr-image');
const openQrBtn = document.getElementById('open-qr-btn'); 
const closeQrBtn = document.getElementById('close-qr-btn');

if (openQrBtn) {
    openQrBtn.addEventListener('click', () => {
        const currentUrl = window.location.href;
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;
        infoModal.style.display = 'none';
        qrModal.style.display = 'flex';
    });
}

if (closeQrBtn) {
    closeQrBtn.addEventListener('click', () => {
        qrModal.style.display = 'none';
        infoModal.style.display = 'flex';
    });
}