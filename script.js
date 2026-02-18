// ==========================================
// --- VERSION CONTROL & AUTO-REFRESH ---
// ==========================================
// IMPORTANT: Change this number whenever you push a new update to GitHub
const APP_VERSION = "2.3.1"; 

function checkVersion() {
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion && savedVersion !== APP_VERSION) {
        console.log("🚀 New version detected. Clearing old cache...");
        if ('caches' in window) {
            caches.keys().then(names => {
                for (let name of names) caches.delete(name);
            }).then(() => {
                localStorage.setItem('app_version', APP_VERSION);
                window.location.reload(true);
            });
        }
    } else {
        localStorage.setItem('app_version', APP_VERSION);
    }
}
checkVersion();

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
      .then(reg => {
          console.log('✅ SERVICE WORKER: Registered!', reg);
          
          // Check for updates while app is open
          reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      showUpdateToast();
                  }
              };
          };
      })
      .catch(err => console.log('❌ SERVICE WORKER: Registration failed:', err));
  });
}

// --- Update Notification Toast ---
function showUpdateToast() {
    const toast = document.createElement('div');
    toast.innerHTML = `✨ Update Available! <button onclick="window.location.reload(true)" style="margin-left:10px; background:var(--neon-green); border:none; border-radius:3px; padding:2px 8px; cursor:pointer;">RELOAD</button>`;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px',
        boxShadow: '0 0 15px var(--neon-green)', zIndex: '10001', fontSize: '14px'
    });
    document.body.appendChild(toast);
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
const getEl = (id) => document.getElementById(id);
const setupModal = getEl('setup-modal');
const lagModal = getEl('lag-modal');
const dishModal = getEl('dish-modal');
const winnerModal = getEl('winner-modal');
const tickerElement = getEl('news-ticker');
const infoModal = getEl('info-modal');
const infoIcon = document.querySelector('.info-icon');
const drillModal = getEl('drill-modal');
const aboutModal = getEl('about-modal');

// --- Match Setup Logic ---
getEl('save-setup-btn')?.addEventListener('click', () => {
    gameState.p1Name = (getEl('p1-input').value || "PLAYER 1").toUpperCase();
    gameState.p2Name = (getEl('p2-input').value || "PLAYER 2").toUpperCase();
    gameState.raceTo = parseInt(getEl('race-input').value) || 3;
    gameState.startTime = new Date();

    getEl('p1-name-display').innerText = gameState.p1Name;
    getEl('p2-name-display').innerText = gameState.p2Name;
    getEl('lag-p1-btn').innerText = gameState.p1Name;
    getEl('lag-p2-btn').innerText = gameState.p2Name;

    setupModal.style.display = 'none';
    lagModal.style.display = 'flex';
    updateTicker(`SETTING UP: ${gameState.p1Name} VS ${gameState.p2Name}`);
});

// --- Lag Logic ---
getEl('lag-p1-btn')?.addEventListener('click', () => startMatch('p1'));
getEl('lag-p2-btn')?.addEventListener('click', () => startMatch('p2'));

function startMatch(winner) {
    gameState.lagWinner = winner;
    lagModal.style.display = 'none';
    updateBreakIndicator();
    updateTicker(`MATCH STARTED! ${gameState[winner+'Name']} WON THE LAG.`);
}

function updateBreakIndicator() {
    const p1Dot = getEl('p1-break-indicator');
    const p2Dot = getEl('p2-break-indicator');
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

getEl('cancel-dish-btn')?.addEventListener('click', () => dishModal.style.display = 'none');

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
    getEl('winner-text').innerText = `${name} WINS THE RACE!`;
    winnerModal.style.display = 'flex';
    updateTicker(`CHAMPION: ${name} WINS THE MATCH!`);
}

// --- UI Helpers ---
function updateUI() {
    getEl('p1-score').innerText = gameState.p1Score;
    getEl('p2-score').innerText = gameState.p2Score;
    getEl('p1-matches').innerText = gameState.p1Matches;
    getEl('p2-matches').innerText = gameState.p2Matches;
    getEl('p1-dishes').innerText = gameState.p1Dishes;
    getEl('p1-rev-dishes').innerText = gameState.p1RevDishes;
    getEl('p2-dishes').innerText = gameState.p2Dishes;
    getEl('p2-rev-dishes').innerText = gameState.p2RevDishes;
}

function updateTicker(message) {
    if (!tickerElement) return;
    tickerElement.innerHTML = `<span>NEWS FLASH:</span> ${message.toUpperCase()} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; RACE TO: ${gameState.raceTo}`;
}

// --- Menu Controls ---
if (infoIcon) {
    infoIcon.addEventListener('click', () => infoModal.style.display = 'flex');
}
getEl('close-info-btn')?.addEventListener('click', () => infoModal.style.display = 'none');

// --- ABOUT & CACHE ---
getEl('open-about-btn')?.addEventListener('click', () => {
    infoModal.style.display = 'none'; 
    aboutModal.style.display = 'flex';
});

getEl('close-about-btn')?.addEventListener('click', () => {
    aboutModal.style.display = 'none';
    infoModal.style.display = 'flex';
});

getEl('clear-cache-btn')?.addEventListener('click', () => {
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

getEl('open-history-btn')?.addEventListener('click', () => {
    const historyList = getEl('history-list');
    infoModal.style.display = 'none';
    const histModal = getEl('history-modal');
    if (histModal) histModal.style.display = 'flex';
    
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
