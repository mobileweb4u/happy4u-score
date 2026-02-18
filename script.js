// ==========================================
// --- 0. PWA & OFFLINE HEALTH CHECK ---
// ==========================================
async function runPWAHealthCheck() {
    console.log("🔍 Starting PWA Health Check...");

    // 1. Check Manifest for Maskable Icons
    try {
        const response = await fetch('./manifest.json');
        const data = await response.json();
        const hasMaskable = data.icons && data.icons.some(icon => icon.purpose.includes('maskable'));
        console.log(hasMaskable ? "✅ MANIFEST: Maskable icons configured." : "⚠️ MANIFEST: Maskable icons missing.");
    } catch (e) { console.warn("❌ MANIFEST: Could not read manifest.json"); }

    // 2. Check Cache for Offline Assets (Drills)
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        if (cacheNames.length === 0) {
            console.warn("⚠️ CACHE: No caches found. App might not work offline yet.");
        } else {
            const cache = await caches.open(cacheNames[0]);
            const cachedRequests = await cache.keys();
            const cachedUrls = cachedRequests.map(req => req.url);
            
            // Specifically check for Drills
            const drillsFound = cachedUrls.filter(url => url.includes('Drill/')).length;
            console.log(`✅ CACHE: ${drillsFound} drill images found in offline storage.`);
            
            if (drillsFound === 0) {
                console.warn("⚠️ CACHE: Drills are NOT cached. Check your sw.js file paths!");
            }
        }
    }
}

// Run health check on load
window.addEventListener('load', runPWAHealthCheck);

// ==========================================
// --- 1. SERVICE WORKER REGISTRATION ---
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ SERVICE WORKER: Registered!', reg))
      .catch(err => console.log('❌ SERVICE WORKER: Registration failed:', err));
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

// --- Match Setup Logic ---
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

// --- Lag Logic ---
document.getElementById('lag-p1-btn').addEventListener('click', () => startMatch('p1'));
document.getElementById('lag-p2-btn').addEventListener('click', () => startMatch('p2'));

function startMatch(winner) {
    gameState.lagWinner = winner;
    lagModal.style.display = 'none';
    updateBreakIndicator();
    updateTicker(`MATCH STARTED! ${gameState[winner+'Name']} WON THE LAG.`);
}

// --- Break/Turn Indicator ---
function updateBreakIndicator() {
    const p1Dot = document.getElementById('p1-break-indicator');
    const p2Dot = document.getElementById('p2-break-indicator');
    if (!gameState.lagWinner) return;

    const isP1Turn = (totalFramesPlayed % 2 === 0) ? (gameState.lagWinner === 'p1') : (gameState.lagWinner !== 'p1');
    
    p1Dot.style.visibility = isP1Turn ? 'visible' : 'hidden';
    p2Dot.style.visibility = isP1Turn ? 'hidden' : 'visible';
}

// --- Scoring Logic ---
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

// --- Winner Logic ---
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

// --- Navigation / Reset ---
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

// --- UI Update Helpers ---
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

// --- Menu & Summary Logic ---
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

// --- REPORT GENERATOR ---
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
    return report;
}

// --- LISTENERS ---
document.getElementById('save-match-btn').addEventListener('click', () => {
    if (matchHistory.length === 0) return alert("No match data to save!");
    const blob = new Blob([generateReportText()], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Match_Report_${gameState.p1Name}_vs_${gameState.p2Name}.txt`;
    link.click();
});

document.getElementById('view-report-btn').addEventListener('click', () => {
    reportTextArea.innerText = generateReportText();
    reportViewModal.style.display = 'flex';
});

document.getElementById('copy-report-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(generateReportText()).then(() => {
        const btn = document.getElementById('copy-report-btn');
        btn.innerText = "✅ COPIED!";
        setTimeout(() => btn.innerText = "📋 COPY", 2000);
    });
});

document.getElementById('reset-history-btn').addEventListener('click', () => {
    if (confirm("Clear frame history?")) {
        matchHistory = [];
        totalFramesPlayed = 0;
        reportTextArea.innerText = generateReportText();
    }
});

document.getElementById('close-report-view').addEventListener('click', () => {
    reportViewModal.style.display = 'none';
});

// --- DRILL VIEWER LOGIC ---
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

document.getElementById('close-drills').addEventListener('click', () => drillModal.style.display = 'none');

// --- CONNECTIVITY TOASTS ---
window.addEventListener('offline', () => showConnectivityToast("⚠️ OFFLINE MODE - SAVING LOCALLY"));
window.addEventListener('online', () => showConnectivityToast("🌐 BACK ONLINE"));

function showConnectivityToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#000', color: '#00ff44', padding: '14px 28px', borderRadius: '8px',
        border: '2px solid #00ff44', zIndex: '10000', fontFamily: 'monospace'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- SHARING & QR LOGIC ---
document.getElementById('share-app-btn').addEventListener('click', async () => {
    try {
        if (navigator.share) {
            await navigator.share({ title: 'Pool Scoreboard', url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
        }
    } catch (err) { console.log(err); }
});

const qrModal = document.getElementById('qr-modal');
const qrImage = document.getElementById('qr-image');
document.getElementById('open-qr-btn').addEventListener('click', () => {
    qrImage.src = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(window.location.href)}`;
    qrModal.style.display = 'flex';
});
document.getElementById('close-qr-btn').addEventListener('click', () => qrModal.style.display = 'none');

// --- PWA INSTALL LOGIC ---
let deferredPrompt;
const installBtn = document.getElementById('install-pwa-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    } else {
        alert("To install on iPhone: Tap the 'Share' icon and select 'Add to Home Screen'.");
    }
});

window.addEventListener('appinstalled', () => {
    installBtn.style.display = 'none';
    alert("Success! The Scoreboard is installed.");
});

if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
  installBtn.style.display = 'none';
}

// --- ABOUT MODAL LOGIC ---
document.getElementById('open-about-btn').addEventListener('click', () => {
    document.getElementById('about-modal').style.display = 'flex';
});

document.getElementById('close-about-btn').addEventListener('click', () => {
    document.getElementById('about-modal').style.display = 'none';
});

// --- CLEAR CACHE LOGIC ---
document.getElementById('clear-cache-btn').addEventListener('click', () => {
    if (confirm("Clear local cache and force-update images?")) {
        caches.keys().then((names) => {
            for (let name of names) caches.delete(name);
        }).then(() => {
            alert("Cache cleared! App will now restart.");
            window.location.reload(true);
        });
    }
});
