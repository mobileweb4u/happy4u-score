// league-manager.js - Source of Truth for Champions League schedule and review state
const LeagueManager = {
    storageKey: 'champions_season_history',

    schedule: [
        {
            id: 'cl-01',
            date: '09/08/26 00:00',
            competition: 'Bar 8 Champions League',
            p1: "ALASTAIR 'KIWI' KEY",
            p2: 'FREDERICK RUSSELL',
            p1Start: 2,
            p2Start: 0,
            venue: 'Bar 8 Singles League',
            pin: 'A8CL-01'
        },
        {
            id: 'cl-02',
            date: '09/08/26 00:00',
            competition: 'Bar 8 Champions League',
            p1: 'ANTHONY ILLINGWORTH',
            p2: 'FREDERICK RUSSELL',
            p1Start: -2,
            p2Start: 3,
            venue: 'Bar 8 Singles League',
            pin: 'A8CL-02'
        },
        {
            id: 'cl-03',
            date: '09/08/26 00:00',
            competition: 'Bar 8 Champions League',
            p1: 'FREDERICK RUSSELL',
            p2: 'RUMEEN FARSAD',
            p1Start: 0,
            p2Start: 0,
            venue: 'Bar 8 Singles League',
            pin: 'A8CL-03'
        },
        {
            id: 'cl-04',
            date: '09/08/26 00:00',
            competition: 'Bar 8 Champions League',
            p1: 'FREDERICK RUSSELL',
            p2: 'GUY SMITH',
            p1Start: 0,
            p2Start: 1,
            venue: 'Bar 8 Singles League',
            pin: 'A8CL-04'
        },
        {
            id: 'cl-05',
            date: '09/08/26 00:00',
            competition: 'Bar 8 Champions League',
            p1: 'FREDERICK RUSSELL',
            p2: 'DARREN PALMER',
            p1Start: 0,
            p2Start: 1,
            venue: 'Bar 8 Singles League',
            pin: 'A8CL-05'
        },
        {
            id: 'cl-06',
            date: '09/08/26 00:00',
            competition: 'Bar 8 Champions League',
            p1: 'FREDERICK RUSSELL',
            p2: 'STEVE WEBB',
            p1Start: 0,
            p2Start: 6,
            venue: 'Bar 8 Singles League',
            pin: 'A8CL-06'
        },
        {
            id: 'cl-07',
            date: '09/08/26 00:00',
            competition: 'Bar 8 Champions League',
            p1: 'FREDERICK RUSSELL',
            p2: 'JAMESH PATEL',
            p1Start: 0,
            p2Start: 2,
            venue: 'Bar 8 Singles League',
            pin: 'A8CL-07'
        },
        {
            id: 'cl-08',
            date: '09/08/26 00:00',
            competition: 'Bar 8 Champions League',
            p1: 'JAMIE WHITE',
            p2: 'FREDERICK RUSSELL',
            p1Start: -2,
            p2Start: 3,
            venue: 'Bar 8 Singles League',
            pin: 'A8CL-08'
        },
        {
            id: 'cl-09',
            date: '09/08/26 00:00',
            competition: 'Bar 8 Champions League',
            p1: 'KINGSLEY',
            p2: 'RYAN',
            p1Start: -5,
            p2Start: 1,
            venue: 'Bar 8 Singles League',
            pin: 'A8CL-09'
        }
    ],

    singlesSchedule: [
        { id: 'd1-00', competition: 'Division 1 Singles League (Red)', p1: 'FREDDIE RUSSELL', p2: 'JOHN CROFT', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-00' },
        { id: 'd1-01', competition: 'Division 1 Singles League (Red)', p1: 'MICK COBURN', p2: 'FREDDIE RUSSELL', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-01' },
        { id: 'd1-02', competition: 'Division 1 Singles League (Red)', p1: 'FREDDIE RUSSELL', p2: 'PAUL RODD', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-02' },
        { id: 'd1-03', competition: 'Division 1 Singles League (Red)', p1: 'CHRIS ISAACS', p2: 'FREDDIE RUSSELL', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-03' },
        { id: 'd1-04', competition: 'Division 1 Singles League (Red)', p1: 'GUY SMITH', p2: 'FREDDIE RUSSELL', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-04' },
        { id: 'd1-05', competition: 'Division 1 Singles League (Red)', p1: 'FREDDIE RUSSELL', p2: 'ALEX BURNETT', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-05' },
        { id: 'd1-06', competition: 'Division 1 Singles League (Red)', p1: 'DAVID ODWELL', p2: 'FREDDIE RUSSELL', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-06' },
        { id: 'd1-07', competition: 'Division 1 Singles League (Red)', p1: 'FREDDIE RUSSELL', p2: 'STUART SMITH', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-07' },
        { id: 'd1-08', competition: 'Division 1 Singles League (Red)', p1: 'AARON WATERER', p2: 'FREDDIE RUSSELL', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-08' },
        { id: 'd1-09', competition: 'Division 1 Singles League (Red)', p1: 'FREDDIE RUSSELL', p2: 'WILLIAM STURDY', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-09' },
        { id: 'd1-10', competition: 'Division 1 Singles League (Red)', p1: 'IAN CABLE', p2: 'FREDDIE RUSSELL', p1Start: 0, p2Start: 0, venue: 'Division 1 Singles League', pin: 'D1-10' }
    ],

    loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || {};
        } catch (error) {
            console.warn('Invalid season history data, resetting.', error);
            localStorage.removeItem(this.storageKey);
            return {};
        }
    },

    saveHistory(history) {
        localStorage.setItem(this.storageKey, JSON.stringify(history));
    },

    getMatchStatus(matchId) {
        const history = this.loadHistory();
        const matchItem = history[matchId];
        return matchItem && matchItem.state === 'COMPLETED' ? 'COMPLETED' : 'PENDING';
    },

    isMatchCompleted(matchId) {
        return this.getMatchStatus(matchId) === 'COMPLETED';
    },

    formatMatchup(match) {
        return `${match.p1} V ${match.p2}`;
    },

    renderSchedule(tableBodyId) {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return;
        const history = this.loadHistory();
        tbody.innerHTML = '';

        this.schedule.forEach((match) => {
            const status = this.getMatchStatus(match.id);
            const row = document.createElement('tr');
            row.className = status === 'COMPLETED' ? 'completed-row' : 'pending-row';

            const scoreValue = history[match.id] ? history[match.id].score : '';
            const statusCell = document.createElement('td');
            statusCell.textContent = status === 'COMPLETED' ? 'COMPLETED ✅' : '● PENDING';
            statusCell.className = 'status-cell';

            const scoreCell = document.createElement('td');
            scoreCell.textContent = scoreValue;
            scoreCell.className = 'score-cell';

            const actionCell = document.createElement('td');
            actionCell.className = 'action-cell';
            if (status === 'COMPLETED') {
                const button = document.createElement('button');
                button.className = 'review-btn';
                button.textContent = 'Review Match';
                button.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.openReview(match.id);
                });
                actionCell.appendChild(button);
                row.classList.add('clickable-row');
                row.addEventListener('click', () => this.openReview(match.id));
            } else {
                actionCell.innerHTML = `<span class="locked-badge">🔒 Locked</span>`;
            }

            row.innerHTML = `
                <td class="date">${match.date}</td>
                <td class="comp">${match.competition}</td>
                <td class="matchup">${this.formatMatchup(match)}</td>
                <td class="venue">${match.venue}</td>
            `;

            row.appendChild(scoreCell);
            row.appendChild(statusCell);
            row.appendChild(actionCell);
            tbody.appendChild(row);
        });
    },

    getReviewPayload(matchId) {
        const history = this.loadHistory();
        const match = this.schedule.find((m) => m.id === matchId);
        const review = history[matchId] || null;
        return {
            match,
            review,
            status: this.getMatchStatus(matchId)
        };
    },

    openReview(matchId) {
        const payload = this.getReviewPayload(matchId);
        const modal = document.getElementById('review-modal');
        const title = document.getElementById('review-title');
        const statusText = document.getElementById('review-status');
        const details = document.getElementById('review-details');

        if (!modal || !title || !statusText || !details) return;

        if (!payload.match) {
            title.textContent = 'Match Review';
            statusText.textContent = 'Match not found in schedule.';
            details.innerHTML = '<p>No review information is available.</p>';
            modal.style.display = 'flex';
            return;
        }

        title.textContent = `${payload.match.p1} vs ${payload.match.p2}`;
        statusText.textContent = payload.status === 'COMPLETED' ? 'COMPLETED ✅' : 'PENDING';
        details.innerHTML = '';

        const summary = document.createElement('div');
        summary.innerHTML = `
            <p><strong>Date:</strong> ${payload.match.date}</p>
            <p><strong>Venue:</strong> ${payload.match.venue}</p>
            <p><strong>Handicap:</strong> ${payload.match.p1Start} / ${payload.match.p2Start}</p>
            <p><strong>PIN:</strong> ${payload.match.pin}</p>
        `;
        details.appendChild(summary);

        if (payload.review && payload.review.notes) {
            const notes = document.createElement('div');
            notes.innerHTML = `<p><strong>Review Notes:</strong></p><pre>${payload.review.notes}</pre>`;
            details.appendChild(notes);
        } else {
            const empty = document.createElement('p');
            empty.textContent = 'No saved review notes for this match.';
            details.appendChild(empty);
        }

        if (payload.review && payload.review.score) {
            const score = document.createElement('p');
            score.innerHTML = `<strong>Final Score:</strong> ${payload.review.score}`;
            details.appendChild(score);
        }

        modal.style.display = 'flex';
    },

    getMatchByIndex(index) {
        return this.schedule[index] || null;
    },

    formatDropdownLabel(match) {
        const p1HC = match.p1Start >= 0 ? `+${match.p1Start}` : `${match.p1Start}`;
        const p2HC = match.p2Start >= 0 ? `+${match.p2Start}` : `${match.p2Start}`;
        return `${match.p1} [${p1HC}] vs ${match.p2} [${p2HC}]`;
    },

    populateDropdown(dropdownId, type = 'bar8') {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        dropdown.innerHTML = '<option value="">-- Choose Match --</option>';
        const list = type === 'singles' ? this.singlesSchedule : this.schedule;

        list.forEach((match, index) => {
            const completed = this.isMatchCompleted(match.id);
            const option = document.createElement('option');
            option.value = index;
            option.textContent = this.formatDropdownLabel(match) + (completed ? ' (COMPLETED)' : '');
            if (completed) option.disabled = true;
            dropdown.appendChild(option);
        });
    },

    getSinglesMatchByIndex(index) {
        return this.singlesSchedule[index] || null;
    },

    markMatchCompleted(matchId, payload = {}) {
        const history = this.loadHistory();
        history[matchId] = Object.assign({
            state: 'COMPLETED',
            timestamp: new Date().toISOString(),
            notes: '',
            score: '',
            reportText: '',
            gameState: null,
            matchHistory: null
        }, payload);
        this.saveHistory(history);
    },

    exportToChampionsFormat() {
        return this.schedule.map((match) => ({
            p1: match.p1,
            p1Start: match.p1Start,
            p2: match.p2,
            p2Start: match.p2Start
        }));
    },

    initialize() {
        window.addEventListener('load', () => {
            this.renderSchedule('schedule-body');
            const closeBtn = document.getElementById('close-review-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    const modal = document.getElementById('review-modal');
                    if (modal) modal.style.display = 'none';
                });
            }
        });
    }
};

// Global exports for dashboard integration
window.LeagueSchedule = LeagueManager.schedule;
window.LeagueManager = LeagueManager;

LeagueManager.initialize();
