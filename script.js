// --- State Management ---
let matchHistory = []; 
let totalFramesPlayed = 0; 
let activeScoringPlayer = null; 
const APP_VERSION = "2.4.0"; // UPDATED TO MASTER VERSION

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
const aboutModal = document.getElementById('about-modal');

// --- NEW: ORIENTATION FIX FOR TABLETS ---
window.addEventListener('resize', () => {
    console.log("🔄 Orientation Changed: " + window.innerWidth + "x" + window.innerHeight);
    updateUI(); 
});

// --- 1. Match Setup Logic ---
document.getElementById('save-setup-btn').addEventListener('click', () => {
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
    const winText = document.getElementById('winner-text');
    winText.innerHTML = `CONGRATULATIONS FINISH <span style="color:var(--neon-magenta);">${name}</span><br>` +
                        `<small style="font-size: 0.7em; color: white;">YOU'VE WON THE RACE</small>`;
    
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

function updateTicker(message) {
    if (!tickerElement) return;
    const liveScore = `LIVE SCORE: ${gameState.p1Name} (${gameState.p1Score}) - ${gameState.p2Name} (${gameState.p2Score})`;
    const raceToHighlight = `RACE TO: <span class="ticker-highlight">${gameState.raceTo}</span>`;
    const p1Stats = `${gameState.p1Name} [D: ${gameState.p1Dishes} | R: ${gameState.p1RevDishes}]`;
    const p2Stats = `${gameState.p2Name} [D: ${gameState.p2Dishes} | R: ${gameState.p2RevDishes}]`;
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
            <div class="history-row">
                <span class="history-frame">F${item.frame}</span>
                <span class="history-winner">${item.winner}</span>
                <span class="history-type">${item.type.replace('-', ' ').toUpperCase()}</span>
            </div>
        `).join('');
    }
});

document.getElementById('close-history-btn').addEventListener('click', () => {
    document.getElementById('history-modal').style.display = 'none';
    infoModal.style.display = 'flex';
});

// --- 9. REPORT GENERATOR ---
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
    report += `║            HAPPY4U MATCH REPORT PREVIEW            ║\n`;
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
    if (matchHistory.length === 0) report += `  > No frames recorded yet.\n`;
    else {
        matchHistory.forEach(item => {
            const frameNum = `FRAME ${item.frame}`.padEnd(10);
            const winner = item.winner.padEnd(15);
            const type = item.type.replace('-', ' ').toUpperCase();
            report += `  [✔] ${frameNum} | WINNER: ${winner} | TYPE: ${type}\n`;
        });
    }
    report += `\n╚════════════════════════════════════════════════════╝\n`;
    report += `           GENERATED BY Freddie Russell          `;
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

// --- 11. DRILL VIEWER ---
const drillImages = ["Drill/drill1.png", "Drill/drill2.png", "Drill/drill3.png", "Drill/drill4.png", "Drill/drill5.png", "Drill/drill6.png", "Drill/drill7.png", "Drill/drill8.png", "Drill/drill9.png"]; 
let currentDrillIndex = 0;
const drillModal = document.getElementById('drill-modal');
const drillDisplay = document.getElementById('drill-display');
const drillName = document.getElementById('drill-name');

document.getElementById('open-drills-btn').addEventListener('click', () => {
    infoModal.style.display = 'none';
    drillModal.style.display = 'flex';
    showDrill(0);
});

function showDrill(index) {
    if (drillImages.length === 0) { drillName.innerText = "No drills found."; return; }
    currentDrillIndex = index;
    drillDisplay.src = drillImages[index];
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

// --- 12. STORAGE, PULSE & RESET LOGIC ---

// Function to calculate storage usage
async function updateStorageDisplay() {
    if (navigator.storage && navigator.storage.estimate) {
        const {usage} = await navigator.storage.estimate();
        const usageInMB = (usage / (1024 * 1024)).toFixed(2);
        const storageInfo = document.getElementById('storage-info');
        if (storageInfo) storageInfo.innerText = `Storage: ${usageInMB} MB`;
    }
}

// Handling the About modal opening
const openAboutBtn = document.getElementById('open-about-btn');
if (openAboutBtn) {
    openAboutBtn.addEventListener('click', () => {
        infoModal.style.display = 'none';
        aboutModal.style.display = 'flex';
        updateStorageDisplay();
    });
}

const closeAboutBtn = document.getElementById('close-about-btn');
if (closeAboutBtn) {
    closeAboutBtn.addEventListener('click', () => {
        aboutModal.style.display = 'none';
        infoModal.style.display = 'flex';
    });
}

// The "Nuclear" Factory Reset
const factoryBtn = document.getElementById('factory-reset-btn');
if (factoryBtn) {
    factoryBtn.addEventListener('click', async () => {
        if (confirm("WARNING: This will wipe all saved data, history, and the offline cache. The app will restart. Proceed?")) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            localStorage.clear();
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let reg of registrations) { await reg.unregister(); }
            window.location.href = window.location.pathname;
        }
    });
}

// Manual Update Button
const updateBtn = document.getElementById('update-app-btn');
if (updateBtn) {
    updateBtn.addEventListener('click', () => {
        updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> UPDATING...';
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.update();
                }
            });
        }
        setTimeout(() => {
            window.location.href = window.location.pathname + "?updated=true";
        }, 2000);
    });
}

// On Load: Check for Pulse and Storage
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('updated')) {
        const headerBadge = document.getElementById('header-v-badge');
        const aboutBadge = document.getElementById('about-v-badge');
        
        if (headerBadge) headerBadge.classList.add('update-success');
        if (aboutBadge) aboutBadge.classList.add('update-success');
        
        setTimeout(() => {
            if (headerBadge) headerBadge.classList.remove('update-success');
            if (aboutBadge) aboutBadge.classList.remove('update-success');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 8000);
    }
    updateStorageDisplay();
});

// --- Updated Match Setup Exit Logic ---
const exitSetupBtn = document.querySelector('#setup-modal .btn-red') || document.querySelector('button[onclick*="exit"]');

if (exitSetupBtn) {
    exitSetupBtn.addEventListener('click', () => {
        // Option A: If you want it to act like a 'Back' button to the Main Menu
        setupModal.style.display = 'none';
        
        // Option B: Hard Reset (The cleanest "Exit" for a Scoreboard)
        if(confirm("Exit setup and reset scoreboard?")) {
            window.location.reload();
        }
    });
}

// Ensure the 'EXIT' button in your HTML has the correct ID
// Example: <button id="exit-setup-btn" class="btn-red">EXIT</button>
