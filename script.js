// ==========================================
// --- 0. PWA & OFFLINE HEALTH CHECK ---
// ==========================================
async function runPWAHealthCheck() {
    console.log("🔍 Starting PWA Health Check...");
    try {
        const response = await fetch('./manifest.json');
        const data = await response.json();
        const hasMaskable = data.icons && data.icons.some(icon => icon.purpose.includes('maskable'));
        console.log(hasMaskable ? "✅ MANIFEST: Maskable icons configured." : "⚠️ MANIFEST: Maskable icons missing.");
    } catch (e) { console.warn("❌ MANIFEST: Could not read manifest.json"); }

    if ('caches' in window) {
        const cacheNames = await caches.keys();
        if (cacheNames.length > 0) {
            const cache = await caches.open(cacheNames[0]);
            const cachedRequests = await cache.keys();
            const cachedUrls = cachedRequests.map(req => req.url);
            const drillsFound = cachedUrls.filter(url => url.includes('Drill/')).length;
            console.log(`✅ CACHE: ${drillsFound} drill images found in offline storage.`);
        }
    }
}
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
const drillModal = document.getElementById('drill-modal');
const aboutModal = document.getElementById('about-modal');

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

function updateBreakIndicator() {
    const p1Dot = document.getElementById('p1-break-indicator');
    const p2Dot = document.getElementById('p2-break-indicator');
    if (!gameState.lagWinner || !p1Dot || !p2Dot) return;
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
        checkWinner(`${winnerName} ${type === 'normal' ? 'WON THE FRAME' : type.replace('-', ' ').toUpperCase() + '!'}`);
    });
});

document.getElementById('cancel-dish-btn').addEventListener('click', () => dishModal.style.display = 'none');

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

// --- UI Helpers ---
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
    tickerElement.innerHTML = `<span>NEWS FLASH:</span> ${message.toUpperCase()} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; RACE TO: ${gameState.raceTo}`;
}

// --- Menu Controls ---
infoIcon.addEventListener('click', () => infoModal.style.display = 'flex');
document.getElementById('close-info-btn').addEventListener('click', () => infoModal.style.display = 'none');

// --- ABOUT & CACHE (New Sections) ---
document.getElementById('open-about-btn').addEventListener('click', () => {
    infoModal.style.display = 'none'; // Close menu
    aboutModal.style.display = 'flex'; // Open about
});

document.getElementById('close-about-btn').addEventListener('click', () => {
    aboutModal.style.display = 'none';
    infoModal.style.display = 'flex'; // Return to menu
});

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

// --- History & Reports ---
function recordFrame(winnerName, type) {
    matchHistory.push({ frame: totalFramesPlayed + 1, winner: winnerName, type: type });
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
                <span style="color: var(--neon-green);">${item.winner}</span>
                <span style="color: var(--neon-magenta);">${item.type.toUpperCase()}</span>
            </div>
        `).join('');
    }
});

// --- Drill Viewer ---
const drillImages = ["Drill/drill1.png", "Drill/drill2.png", "Drill/drill3.png"]; // Add more as needed
let currentDrillIndex = 0;

document.getElementById('open-drills-btn').addEventListener('click', () => {
    infoModal.style.display = 'none';
    drillModal.style.display = 'flex';
});

document.getElementById('close-drills').addEventListener('click', () => drillModal.style.display = 'none');

// (Keep your existing Sharing, QR, and PWA Install logic from here down...)
