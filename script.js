// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker Registered!', reg))
      .catch(err => console.log('Service Worker failed:', err));
  });
}

// --- State Management ---
let matchHistory = []; 
let totalFramesPlayed = 0; 
let activeScoringPlayer = null; 

let gameState = {
    p1Name: "PLAYER 1",
    p2Name: "PLAYER 2",
    p1Score: 0,
    p2Score: 0,
    p1Matches: 0,
    p2Matches: 0,
    p1Dishes: 0,
    p1RevDishes: 0,
    p2Dishes: 0,
    p2RevDishes: 0,
    raceTo: 3,
    lagWinner: null,
    startTime: null 
};

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

// --- 1. Match Setup Logic (UPPERCASE ENFORCED HERE) ---
document.getElementById('save-setup-btn').addEventListener('click', () => {
    // Force uppercase immediately on input
    gameState.p1Name = (document.getElementById('p1-input').value || "PLAYER 1").toUpperCase();
    gameState.p2Name = (document.getElementById('p2-input').value || "PLAYER 2").toUpperCase();
    gameState.raceTo = parseInt(document.getElementById('race-input').value) || 3;
    gameState.startTime = new Date();

    document.getElementById('p1-name-display').innerText = gameState.p1Name;
    document.getElementById('p2-name-display').innerText = gameState.p2Name;
    document.getElementById('lag-p1-btn').innerText = gameState.p1Name;
    document.getElementById('lag-p2-btn').innerText = gameState.p2Name;

    setupModal.style.display = 'none';
    lagModal.style.display = 'flex';
    
    updateTicker(`SETTING UP: ${gameState.p1Name} VS ${gameState.p2Name}`);
});

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
    if (!gameState.lagWinner) return;

    const isP1Turn = (totalFramesPlayed % 2 === 0) ? (gameState.lagWinner === 'p1') : (gameState.lagWinner !== 'p1');
    
    p1Dot.style.visibility = isP1Turn ? 'visible' : 'hidden';
    p2Dot.style.visibility = isP1Turn ? 'hidden' : 'visible';
}

// --- 4. Scoring Logic ---
document.querySelectorAll('.btn-plus').forEach(btn => {
    btn.addEventListener('click', () => {
        activeScoringPlayer = btn.dataset.player;
        dishModal.style.display = 'flex';
    });
});

document.querySelectorAll('.dish-option').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const p = activeScoringPlayer;
        const winnerName = gameState[p + 'Name'];

        recordFrame(winnerName, type);

        if (type === 'break-dish') gameState[p + 'Dishes']++;
        else if (type === 'reverse-dish') gameState[p + 'RevDishes']++;

        gameState[p + 'Score']++;
        totalFramesPlayed++;
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
    if (gameState.p1Score >= gameState.raceTo) {
        gameState.p1Matches++;
        showWinner(gameState.p1Name);
    } else if (gameState.p2Score >= gameState.raceTo) {
        gameState.p2Matches++;
        showWinner(gameState.p2Name);
    } else {
        updateTicker(newsEvent);
    }
}

function showWinner(name) {
    document.getElementById('winner-text').innerText = `${name} WINS THE RACE!`;
    winnerModal.style.display = 'flex';
    updateTicker(`CHAMPION: ${name} WINS THE MATCH!`);
}

// --- 6. Navigation / Reset ---
document.getElementById('again-race-btn').addEventListener('click', () => {
    gameState.p1Score = 0;
    gameState.p2Score = 0;
    winnerModal.style.display = 'none';
    updateUI();
    updateBreakIndicator();
    updateTicker("NEW RACE STARTED!");
});

document.getElementById('new-race-btn').addEventListener('click', () => location.reload());

document.querySelectorAll('.end-game').forEach(btn => {
    btn.addEventListener('click', () => {
        if(confirm("End current match and reset everything?")) location.reload();
    });
});

// --- 7. UI Update Helpers ---
function updateUI() {
    document.getElementById('p1-score').innerText = gameState.p1Score;
    document.getElementById('p2-score').innerText = gameState.p2Score;
    document.getElementById('p1-matches').innerText = gameState.p1Matches;
    document.getElementById('p2-matches').innerText = gameState.p2Matches;
    document.getElementById('p1-dishes').innerText = gameState.p1Dishes;
    document.getElementById('p1-rev-dishes').innerText = gameState.p1RevDishes;
    document.getElementById('p2-dishes').innerText = gameState.p2Dishes;
    document.getElementById('p2-rev-dishes').innerText = gameState.p2RevDishes;
}

// --- TICKER UPDATE LOGIC (MODIFIED FOR CAPITAL NAMES & SPECIFIC LABELS) ---
function updateTicker(message) {
    if (!tickerElement) return;
    
    const liveScore = `LIVE SCORE: ${gameState.p1Name} (${gameState.p1Score}) - ${gameState.p2Name} (${gameState.p2Score})`;
    const raceToHighlight = `RACE TO: <span class="ticker-highlight">${gameState.raceTo}</span>`;
    
    const p1Stats = `${gameState.p1Name} [Break Dishes: ${gameState.p1Dishes} | Reverse Dishes: ${gameState.p1RevDishes}]`;
    const p2Stats = `${gameState.p2Name} [Break Dishes: ${gameState.p2Dishes} | Reverse Dishes: ${gameState.p2RevDishes}]`;
    
    const racesWon = `RACES WON: ${gameState.p1Name} (${gameState.p1Matches}) - ${gameState.p2Name} (${gameState.p2Matches})`;

    tickerElement.innerHTML = `
        <span>NEWS FLASH:</span> ${message.toUpperCase()} 
        &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ${raceToHighlight}
        &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ${liveScore} 
        &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ${p1Stats} | ${p2Stats}
        &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ${racesWon}
    `;
}

// --- 8. Menu & Summary Logic ---
infoIcon.addEventListener('click', () => infoModal.style.display = 'flex');
document.getElementById('close-info-btn').addEventListener('click', () => infoModal.style.display = 'none');

function recordFrame(winnerName, type) {
    matchHistory.push({
        frame: totalFramesPlayed + 1,
        winner: winnerName,
        type: type
    });
}

document.getElementById('open-history-btn').addEventListener('click', () => {
    const historyList = document.getElementById('history-list');
    infoModal.style.display = 'none';
    document.getElementById('history-modal').style.display = 'flex';

    if (matchHistory.length === 0) {
        historyList.innerHTML = '<p style="color: #666; padding: 20px;">No frames recorded yet.</p>';
    } else {
        historyList.innerHTML = matchHistory.slice().reverse().map(item => `
            <div class="history-row" style="display: flex; justify-content: space-between; border-bottom: 1px solid #222; padding: 10px;">
                <span style="color: #666;">F${item.frame}</span>
                <span style="color: var(--neon-green); font-weight: bold;">${item.winner}</span>
                <span style="color: var(--neon-magenta); text-align: right;">${item.type.replace('-', ' ').toUpperCase()}</span>
            </div>
        `).join('');
    }
});

document.getElementById('close-history-btn').addEventListener('click', () => {
    document.getElementById('history-modal').style.display = 'none';
    infoModal.style.display = 'flex';
});

// --- 9. SYNCHRONIZED REPORT GENERATOR ---
function generateReportText() {
    const now = new Date();
    const timestamp = now.toLocaleString();
    
    let durationText = "00:00:00";
    if (gameState.startTime) {
        const diff = Math.abs(now - gameState.startTime);
        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        durationText = `${hours}:${minutes}:${seconds}`;
    }

    let report = `╔════════════════════════════════════════════════════╗\n`;
    report += `║             HAPPY4U MATCH REPORT PREVIEW           ║\n`;
    report += `╠════════════════════════════════════════════════════╣\n`;
    report += `  DATE:     ${timestamp}\n`;
    report += `  DURATION: ${durationText} (HH:MM:SS)\n`;
    report += `  RACE TO:  ${gameState.raceTo}\n`;
    report += `------------------------------------------------------\n`;
    report += `  LIVE SCORE: ${gameState.p1Name} (${gameState.p1Score}) - ${gameState.p2Name} (${gameState.p2Score})\n`;
    report += `  RACES WON:  ${gameState.p1Name} [${gameState.p1Matches}] | ${gameState.p2Name} [${gameState.p2Matches}]\n`;
    report += `------------------------------------------------------\n`;
    report += `  PLAYER STATISTICS:\n`;
    report += `  ${gameState.p1Name.padEnd(15)} [DISHES: ${gameState.p1Dishes} | REV: ${gameState.p1RevDishes}]\n`;
    report += `  ${gameState.p2Name.padEnd(15)} [DISHES: ${gameState.p2Dishes} | REV: ${gameState.p2RevDishes}]\n`;
    report += `------------------------------------------------------\n\n`;
    report += `  MATCH PROGRESS LOG:\n`;
    
    if (matchHistory.length === 0) {
        report += `  > No frames recorded yet.\n`;
    } else {
        matchHistory.forEach(item => {
            const frameNum = `FRAME ${item.frame}`.padEnd(10);
            const winner = item.winner.padEnd(15);
            const type = item.type.replace('-', ' ').toUpperCase();
            report += `  [✔] ${frameNum} | WINNER: ${winner} | TYPE: ${type}\n`;
        });
    }

    report += `\n╚════════════════════════════════════════════════════╝\n`;
    report += `           GENERATED BY Freddie Russell           `;
    return report;
}

// --- 10. LISTENERS ---
document.getElementById('save-match-btn').addEventListener('click', () => {
    if (matchHistory.length === 0) return alert("No match data to save!");
    const blob = new Blob([generateReportText()], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Match_Report_${gameState.p1Name}_vs_${gameState.p2Name}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
});

document.getElementById('view-report-btn').addEventListener('click', () => {
    reportTextArea.innerText = generateReportText();
    reportViewModal.style.display = 'flex';
});

document.getElementById('copy-report-btn').addEventListener('click', () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copy-report-btn');
        const originalText = btn.innerText;
        btn.innerText = "✅ COPIED!";
        setTimeout(() => btn.innerText = originalText, 2000);
    });
});

document.getElementById('reset-history-btn').addEventListener('click', () => {
    if (confirm("Clear frame history?")) {
        matchHistory = [];
        totalFramesPlayed = 0;
        reportTextArea.innerText = generateReportText();
        updateTicker("HISTORY RESET");
    }
});

document.getElementById('close-report-view').addEventListener('click', () => {
    reportViewModal.style.display = 'none';
});

document.getElementById('exit-btn').addEventListener('click', () => {
    if (confirm("Are you sure you want to exit?")) {
        window.close();
        window.location.href = "about:blank"; 
    }
});

// --- 11. DRILL VIEWER LOGIC ---
const drillImages = [
    "Drill/drill1.png", 
    "Drill/drill2.png", 
    "Drill/drill3.png", 
    "Drill/drill4.png", 
    "Drill/drill5.png", 
    "Drill/drill6.png", 
    "Drill/drill7.png", 
    "Drill/drill8.png", 
    "Drill/drill9.png"
]; // ADD YOUR FILENAMES HERE!

let currentDrillIndex = 0;

const drillModal = document.getElementById('drill-modal');
const drillDisplay = document.getElementById('drill-display');
const drillName = document.getElementById('drill-name');

document.getElementById('open-drills-btn').addEventListener('click', () => {
    infoModal.style.display = 'none'; // Close the menu if open
    drillModal.style.display = 'flex';
    showDrill(0);
});

function showDrill(index) {
    if (drillImages.length === 0) {
        drillName.innerText = "No drills found in folder.";
        return;
    }
    currentDrillIndex = index;
    drillDisplay.src = drillImages[index];
    // This cleans up the file path to show just the name
    drillName.innerText = drillImages[index].replace('Drill/', '').replace('.png', '').toUpperCase();
}

document.getElementById('next-drill').addEventListener('click', () => {
    currentDrillIndex = (currentDrillIndex + 1) % drillImages.length;
    showDrill(currentDrillIndex);
});

document.getElementById('prev-drill').addEventListener('click', () => {
    currentDrillIndex = (currentDrillIndex - 1 + drillImages.length) % drillImages.length;
    showDrill(currentDrillIndex);
});

document.getElementById('close-drills').addEventListener('click', () => {
    drillModal.style.display = 'none';
});

// --- 12. OFFLINE/ONLINE NOTIFICATIONS ---
window.addEventListener('offline', () => {
    updateTicker("⚠️ OFFLINE MODE ACTIVE - APP RUNNING FROM CACHE");
    showConnectivityToast("You are now offline. Matches will still save locally!");
});

window.addEventListener('online', () => {
    updateTicker("🌐 BACK ONLINE - STABLE CONNECTION RESTORED");
    showConnectivityToast("You are back online!");
});

function showConnectivityToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    
    // Advanced Neon Styling for AMOLED Screens
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#000',
        color: '#00ff44', 
        padding: '14px 28px',
        borderRadius: '8px', // Sharper "Pro" look
        border: '2px solid #00ff44',
        // Multi-layered glow: 1. Green inner, 2. Green outer, 3. Soft spread
        boxShadow: '0 0 10px #00ff44, inset 0 0 5px #00ff44, 0 0 20px rgba(0, 255, 68, 0.4)',
        textShadow: '0 0 5px #00ff44', // Makes the text itself glow
        zIndex: '10000',
        fontSize: '15px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        letterSpacing: '1px',
        transition: 'opacity 0.5s ease, bottom 0.5s ease'
    });

    document.body.appendChild(toast);

    // Small "pop-up" animation
    setTimeout(() => {
        toast.style.bottom = '40px';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.bottom = '20px';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}
