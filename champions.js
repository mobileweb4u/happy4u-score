// champions.js - Data and Reporting for Bar 8 Champions League
const ChampionsLeague = {
    matches: [
        { p1: "Alastair ", p1Start: 2, p2: "Freddie", p2Start: 0 },
        { p1: "Anthony ", p1Start: -2, p2: "Freddie", p2Start: 3 },
        { p1: "Freddie ", p1Start: 0, p2: "Rumeen", p2Start: 0 },
        { p1: "Freddie ", p1Start: 0, p2: "GUY", p2Start: 1 },
        { p1: "Freddie ", p1Start: 0, p2: "DARREN", p2Start: 1 },
        { p1: "Freddie ", p1Start: 0, p2: "STEVE", p2Start: 6 },
        { p1: "JAMIE ", p1Start: -2, p2: "Freddie", p2Start: 3 },
        { p1: "Freddie", p1Start: 0, p2: "Jaymesh", p2Start: 2 },
        { p1: "KINGSLEY", p1Start: -5, p2: "RYAN", p2Start: 1 }
    ],

    populateDropdown: function(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        dropdown.innerHTML = '<option value="">-- Choose Match --</option>';
        this.matches.forEach((match, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${match.p1} [${match.p1Start}] vs ${match.p2} [${match.p2Start}]`;
            dropdown.appendChild(option);
        });
    },

    handleSelection: function(index) {
        const match = this.matches[index];
        if (!match) return;

        // 1. Set the live scores to the handicap values immediately
        gameState.p1Name = match.p1.toUpperCase().trim();
        gameState.p2Name = match.p2.toUpperCase().trim();
        gameState.p1Score = match.p1Start; 
        gameState.p2Score = match.p2Start; 

        // 2. Archive these starting values for the log generator
        gameState.p1ScoreStart = match.p1Start; 
        gameState.p2ScoreStart = match.p2Start;
        
        const p1In = document.getElementById('p1-input');
        const p2In = document.getElementById('p2-input');
        if (p1In) p1In.value = match.p1.trim();
        if (p2In) p2In.value = match.p2.trim();
    },

    generateReport: function() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB') + ", " + now.toLocaleTimeString('en-GB', { hour12: false });
        
        const startP1 = gameState.p1ScoreStart || 0;
        const startP2 = gameState.p2ScoreStart || 0;
        const isFinished = (gameState.p1Score >= gameState.raceTo || gameState.p2Score >= gameState.raceTo);
        const statusText = isFinished ? "FINISHED ✅" : "IN PROGRESS 🏃";

        let report = `DATE:      ${dateStr}\n`;
        report +=    `TYPE:      STANDARD RACE TO ${gameState.raceTo}\n`;
        report +=    `STATUS:    ${statusText}\n`;
        report +=    `SCORE:     ${gameState.p1Name} (${gameState.p1Score}) - ${gameState.p2Name} (${gameState.p2Score})\n`;
        report +=    `----------------------------------------------------------------------------------------------------------\n`;

        report += `PLAYER STATISTICS:\n`;
        // Statistics display "FRAME-F" (Frames For) which includes the handicap
        report += `${gameState.p1Name.padEnd(20)} | DISHES: ${gameState.p1Dishes} | REV: ${gameState.p1RevDishes}\n`;
        report += `                     | FRAME-F: ${gameState.p1Score} | FRAME-A: ${gameState.p2Score}\n`;
        report += `..........................................................................................................\n`;
        report += `${gameState.p2Name.padEnd(20)} | DISHES: ${gameState.p2Dishes} | REV: ${gameState.p2RevDishes}\n`;
        report += `                     | FRAME-F: ${gameState.p2Score} | FRAME-A: ${gameState.p1Score}\n`;
        report += `----------------------------------------------------------------------------------------------------------\n\n`;

        report += `MATCH PROGRESS LOG:\n`;
        
        let frameCount = 1;
        
        // 3. AUTOMATED HANDICAP LOGGING
        // This adds "virtual" frames to the log if a player starts above 0
        if (startP1 > 0) {
            for (let i = 0; i < startP1; i++) {
                report += `[✔] ${`FRAME ${frameCount}`.padEnd(12)} | ${`WINNER: ${gameState.p1Name}`.padEnd(25)} | TYPE: HANDICAP\n`;
                frameCount++;
            }
        }
        if (startP2 > 0) {
            for (let i = 0; i < startP2; i++) {
                report += `[✔] ${`FRAME ${frameCount}`.padEnd(12)} | ${`WINNER: ${gameState.p2Name}`.padEnd(25)} | TYPE: HANDICAP\n`;
                frameCount++;
            }
        }
        
        // 4. ADD ACTUAL PLAYED FRAMES
        matchHistory.forEach((item) => {
            const frameStr = `FRAME ${frameCount}`.padEnd(12);
            const winnerStr = `WINNER: ${item.winner.toUpperCase()}`.padEnd(25);
            const typeStr = `TYPE: ${item.type.toUpperCase()}`;
            report += `[✔] ${frameStr} | ${winnerStr} | ${typeStr}\n`;
            frameCount++;
        });

        report += `\n__________________________________________________________________________________________________________\n`;
        report += `                             GENERATED BY Freddie Russell`;
        
        return report;
    }
};

// Division 1 Singles League (Red)
const SinglesLeague = {
    matches: [
        { p1: "Freddie", p1Start: 0, p2: "JOHN", p2Start: 0 },
        { p1: "MICK", p1Start: 0, p2: "Freddie", p2Start: 0 }
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