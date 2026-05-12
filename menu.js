// menu.js - Master Controller
let selectedLeagueLabel = "Race To"; 

document.addEventListener('DOMContentLoaded', () => {
    const bar8Checkbox = document.getElementById('bar8HandicapActive');
    const singlesLeagueCheckbox = document.getElementById('SinglesLeague(Red)Active'); 
    const practiceCheckbox = document.getElementById('PracticeNightActive'); // NEW ID
    
    const saveBtn = document.getElementById('save-setup-btn');
    const raceInput = document.getElementById('race-input');
    const mainTitle = document.getElementById('main-title');

    // 1. Bar 8 Logic
    if (bar8Checkbox) {
        bar8Checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedLeagueLabel = "Bar 8 Champions League";
                raceInput.value = 11; 
                if(singlesLeagueCheckbox) singlesLeagueCheckbox.checked = false;
                if(practiceCheckbox) practiceCheckbox.checked = false; 
            }
        });
    }

    // 2. Singles League Logic
    if (singlesLeagueCheckbox) {
        singlesLeagueCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedLeagueLabel = "Division 1 Singles League (Red)";
                raceInput.value = 12; 
                if(bar8Checkbox) bar8Checkbox.checked = false;
                if(practiceCheckbox) practiceCheckbox.checked = false;
            }
        });
    }

    // 3. NEW: Practice Night Logic
    if (practiceCheckbox) {
        practiceCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedLeagueLabel = "Practice Night";
                raceInput.value = 5; // Default practice race
                if(bar8Checkbox) bar8Checkbox.checked = false;
                if(singlesLeagueCheckbox) singlesLeagueCheckbox.checked = false;
            } else {
                selectedLeagueLabel = "Race To";
            }
        });
    }

    // 4. The Bridge Fix: Updates Title and Triggers Lag
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (mainTitle) {
                mainTitle.innerHTML = `${selectedLeagueLabel} <span id="race-goal-display" style="color: #00ff44;">${raceInput.value}</span>`;
            }

            const setupModal = document.getElementById('setup-modal');
            if (setupModal) {
                setupModal.style.display = 'none';
            }

            setTimeout(() => {
                const lagModal = document.getElementById('lag-modal');
                if (lagModal) {
                    lagModal.style.display = 'flex';
                    lagModal.style.zIndex = "9999"; 
                }
            }, 100); 
        });
    }
});