// practice.js - Logic for Practice Night Mode

// 1. DATA OBJECT: Contains your player pairings
const PracticeNightActive = {
    matches: [
        { p1: "Freddie", p1Start: 0, p2: "CHRIS", p2Start: 0 },
        { p1: "Freddie", p1Start: 0, p2: "Tubbz", p2Start: 0 },
        { p1: "Freddie", p1Start: 0, p2: "Milton", p2Start: 0 },
        { p1: "Freddie", p1Start: 0, p2: "Pete", p2Start: 0 }, 
        { p1: "IAN", p1Start: 0, p2: "Freddie", p2Start: 0 }     
    ],

    populateDropdown: function(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        dropdown.innerHTML = '<option value="">-- Choose Match --</option>';
        this.matches.forEach((match, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${match.p1} vs ${match.p2}`;
            dropdown.appendChild(option);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Identify UI Elements from index.html
    const practiceCheckbox = document.getElementById('PracticeNightActive');
    const practiceSelector = document.getElementById('practice-match-selector'); 
    const practiceDropdown = document.getElementById('practice-match-dropdown');
    const raceInput = document.getElementById('race-input');
    
    // The actual input boxes the scoreboard engine reads (Fixed IDs)
    const p1Input = document.getElementById('p1-input');
    const p2Input = document.getElementById('p2-input');

    // Initialize the Dropdown with data
    PracticeNightActive.populateDropdown('practice-match-dropdown');

    // 2. Logic: What happens when you check the "Practice Night" box
    if (practiceCheckbox) {
        practiceCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Update the global label for the header title
                if (typeof selectedLeagueLabel !== 'undefined') {
                    selectedLeagueLabel = "Practice Night";
                }
                
                // Set default Practice Race to 5
                if (raceInput) raceInput.value = 5; 
                
                // Reveal the practice match dropdown
                if (practiceSelector) practiceSelector.style.display = 'block';

                // Mutual Exclusion: Uncheck official leagues
                const bar8 = document.getElementById('bar8HandicapActive');
                const div1 = document.getElementById('SinglesLeague(Red)Active');
                if (bar8) bar8.checked = false;
                if (div1) div1.checked = false;
            } else {
                if (typeof selectedLeagueLabel !== 'undefined') {
                    selectedLeagueLabel = "Race To";
                }
                if (practiceSelector) practiceSelector.style.display = 'none';
            }
        });
    }

    // 3. Logic: What happens when you select a match from the dropdown
    if (practiceDropdown) {
        practiceDropdown.addEventListener('change', (e) => {
            const index = e.target.value;
            if (index !== "") {
                const match = PracticeNightActive.matches[index];
                
                // CRITICAL: This pushes the names into the setup inputs p1-input and p2-input
                if (p1Input) p1Input.value = match.p1;
                if (p2Input) p2Input.value = match.p2;
                
                console.log(`Practice names loaded: ${match.p1} vs ${match.p2}`);
            }
        });
    }
});