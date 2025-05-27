const teams = window.teams;
const borders = window.borders;

const abbreviations = {
    conference: {
        "Western": "West",
        "Eastern": "East",
        "American": "AM",
        "National": "NAT",
        "Big Ten": "Big 10",
        "SEC": "SEC",
        "ACC": "ACC",
        "Big 12": "Big 12",
        "Big East": "Big E",
    },
};

const sportIcons = {
    Basketball: "https://cdn-icons-png.flaticon.com/128/3858/3858976.png",
    Football: "https://cdn-icons-png.flaticon.com/128/521/521789.png",
    Baseball: "https://cdn-icons-png.flaticon.com/128/3210/3210549.png",
    Hockey: "https://cdn-icons-png.flaticon.com/128/6627/6627840.png"
};

function isMobileScreen() {
    return window.innerWidth <= 600;
}

function showRules() {
    document.getElementById("how-to-play-modal").classList.remove("hidden");
}

function hideRules() {
    document.getElementById("how-to-play-modal").classList.add("hidden");
}

function showResultModal(won) {
    const modal = document.getElementById("result-modal");
    const message = document.getElementById("result-message");
    const logo = document.getElementById("team-logo");
    const name = document.getElementById("team-name");

    if (won) {
        message.textContent = `You got it in ${guessedTeams.length}!`;
    } else {
        message.textContent = "Game Over!";
    }
    logo.src = answer.logo || "https://via.placeholder.com/80";
    name.textContent = answer.name;

    modal.classList.remove("hidden");
}

function playMore() {
    hideResultModal();
    if (!isRandomMode) {
        toggleMode();
    } else {
        randomizeGame();
    }
}

function hideResultModal() {
    document.getElementById("result-modal").classList.add("hidden");
}

const emojiMap = {
    green: "🟩",
    yellow: "🟨",
    gray: "⬜️",
    placeholder: "⬛️"
};

function buildEmojiGrid() {
    const guessContainers = document.querySelectorAll(".guess-row-container");
    let grid = "";

    for (let i = 0; i < guessedTeams.length; i++) {
        const row = guessContainers[i].querySelectorAll(".guess-box");
        row.forEach(box => {
            if (box.classList.contains("green")) {
                grid += emojiMap.green;
            } else if (box.classList.contains("yellow")) {
                grid += emojiMap.yellow;
            } else if (box.classList.contains("gray")) {
                grid += emojiMap.gray;
            } else {
                grid += emojiMap.placeholder;
            }
        });
        grid += "\n";
    }
    return grid.trim();
}

function shareResult() {
    const grid = buildEmojiGrid();
    let shareText = "";
    if (!isRandomMode) {
        const today = getEasternDate();
        const dateString = `${today.month}/${today.day}/${today.year}`;
        shareText = `Team Guess ${dateString} : ${guessedTeams.length}/${maxGuesses}\n`;
        if (gotCorrect) {
            shareText += `I got it in ${guessedTeams.length}!`;
        } else {
            shareText += `I didn’t get it.`;
        }
    } else {
        shareText = `I played Team Guess (Random Mode) and `;
        if (gotCorrect) {
            shareText += `got it in ${guessedTeams.length}!`;
        } else {
            shareText += `didn't get it.`;
        }
        shareText += ` The answer was the ${answer.name}.`;
    }
    shareText += `\n\nMy guesses:\n${grid}\n\nTry Team Guess: [your-game-url]`;
    if (navigator.share) {
        navigator.share({
            title: "Team Guess",
            text: shareText,
        }).catch(() => {
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert("Copied to clipboard!");
        }).catch(() => {
            alert("Unable to copy to clipboard.");
        });
    }
}

let isRandomMode = false;
const maxGuesses = 8;
let gotCorrect = false;
let gotWrong = false;

let correctFilters = {
    league: null,
    sport: null,
};

let incorrectFilters = {
    league: new Set(),
    sport: new Set(),
};

let guessedTeams = [];

function toggleMode() {
    isRandomMode = !isRandomMode;
    const modeText = document.getElementById('mode-text');
    const modeIcon = document.getElementById('mode-icon');
    const randomizeContainer = document.getElementById('randomize-container');
    hideRules();
    if (isRandomMode) {
        modeText.textContent = "Play Daily";
        modeIcon.src = "https://icons.veryicon.com/png/o/miscellaneous/face-monochrome-icon/calendar-249.png";
        randomizeContainer.classList.remove("hidden");
        startRandomGame();
    } else {
        modeText.textContent = "Play More";
        modeIcon.src = "https://cdn-icons-png.flaticon.com/128/3114/3114904.png";
        randomizeContainer.classList.add("hidden");
        startDailyGame();
    }
    updateGameContainerSpacing();
}

function startRandomGame() {
    hideRules();
    hideResultModal();
    gotCorrect = false;
    gotWrong = false;
    guessedTeams = [];
    correctFilters = {
        league: null,
        sport: null
    };
    incorrectFilters = {
        league: new Set(),
        sport: new Set(),
    };
    filterSuggestions();
    answer = teams[Math.floor(Math.random() * teams.length)];
    clearGuesses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateGameContainerSpacing() {
    const header = document.querySelector('.header');
    const gameContainer = document.querySelector('.game-container');
    if (header && gameContainer) {
        const height = header.offsetHeight;
        gameContainer.style.paddingTop = `${height}px`; // fine-tuned value
    }
}
window.addEventListener('DOMContentLoaded', updateGameContainerSpacing);
window.addEventListener('resize', updateGameContainerSpacing);

function getEasternDate() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year').value);
    const month = parseInt(parts.find(p => p.type === 'month').value);
    const day = parseInt(parts.find(p => p.type === 'day').value);
    return { year, month, day };
}

function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * 1000000);
}

function startDailyGame() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const loaded = loadDailyGameState();
    if (loaded) {
        return;
    }
    guessedTeams = [];
    incorrectFilters = {
        league: new Set(),
        sport: new Set(),
    };
    filterSuggestions();
    clearGuesses();
    const todayET = getEasternDate();
    const seed = todayET.year * 10000 + todayET.month * 100 + todayET.day;
    const rngIndex = seededRandom(seed) % teams.length;
    answer = teams[rngIndex]; 

    saveDailyGameState();
}

function refreshAbbreviations() {
    const isMobile = isMobileScreen();
    const guessRows = document.querySelectorAll(".guess-row");

    guessRows.forEach(row => {
        const boxes = row.querySelectorAll(".guess-box");

        const fieldOrder = ["state", "colors", "titles", "lastTitle", "league", "conference", "sport"];

        fieldOrder.forEach((field, index) => {
            if (field === "conference" || field === "sport") {
                const box = boxes[index];
                const fullValue = box.getAttribute("data-full");
                if (!fullValue) {
                    return;
                }

                if (field === "sport" && isMobile) {
                    box.innerHTML = "";
                    const img = document.createElement("img");
                    img.src = sportIcons[fullValue] || "";
                    img.alt = fullValue;
                    img.style.width = "15px";
                    img.style.height = "15px";
                    box.appendChild(img);
                } else {
                    const displayValue = isMobile ? (abbreviations[field][fullValue] || fullValue) : fullValue;
                    box.textContent = displayValue;
                }        

            }
        });
    });
}

function renderPreviousGuesses() {
    const guessList = guessedTeams;
    for (let i = 0; i < guessedTeams.length; i++) {
        const guessName = guessList[i];
        const team = teams.find(t => t.name.toLowerCase() === guessName);
        if (team) {
            renderGuess(team, i);
        }
    }
}

function renderGuess(team, rowIndex) {
    const guessRowContainers = document.querySelectorAll(".guess-row-container");
    const currentRowContainer = guessRowContainers[rowIndex];
    const teamNameBox = currentRowContainer.querySelector(".team-name-box");
    const guessBoxes = currentRowContainer.querySelectorAll(".guess-box");

    teamNameBox.textContent = team.name;
    teamNameBox.classList.remove("placeholder");

    const fields = ["state", "colors", "titles", "lastTitle", "league", "conference", "sport"];
    fields.forEach((field, index) => {
        const box = guessBoxes[index];
        box.classList.remove("placeholder");

        if (field == "colors") {
            box.classList.add("colors");
            box.innerHTML = "";
            const [color1, color2] = team[field].split("/");
            const circle1 = document.createElement("span");
            circle1.classList.add("color-circle");
            circle1.style.backgroundColor = colorMap[color1] || "#C0C0C0";
            const circle2 = document.createElement("span");
            circle2.classList.add("color-circle");
            circle2.style.backgroundColor = colorMap[color2] || "#C0C0C0";

            box.appendChild(circle1);
            box.appendChild(circle2);
        } else {
            let value = team[field];
            box.setAttribute("data-full", value);

            if (isMobileScreen()) {
                if (field === "conference") {
                    value = abbreviations[field][value] || value;
                    box.textContent = value;
                } else if (field === "sport") {
                    box.innerHTML = "";
                    const img = document.createElement("img");
                    img.src = sportIcons[value] || ""; 
                    img.alt = value;
                    img.style.width = "20px";
                    img.style.height = "20px";
                    box.appendChild(img);
                } else {
                    box.textContent = value;
                }
            } else {
                box.textContent = value;
            }
        }

        if (team[field] === answer[field]) {
            box.classList.add("green");
        } else if (field === "state" && borders[answer.state] && borders[answer.state].includes(team.state)) {
            box.classList.add("yellow");
        } else if (field === "colors" && team[field].split("/").some(color => answer[field].split("/").includes(color))) {
            box.classList.add("yellow");
        } else if (field === "titles" && Math.abs(parseInt(team[field]) - parseInt(answer[field])) <= 3) {
            box.classList.add("yellow");
        } else if (field === "lastTitle" && team[field] !== "None" && answer[field] !== "None" && Math.abs(parseInt(team[field]) - parseInt(answer[field])) <= 5) {
            box.classList.add("yellow");
        } else {
            box.classList.add("gray");
        }

        if (field === "titles") {
            if (parseInt(team[field]) < parseInt(answer[field])) {
                box.textContent += " ↑";
            } else if (parseInt(team[field]) > parseInt(answer[field])) {
                box.textContent += " ↓";
            }
        }
        if (field === "lastTitle") {
            box.textContent = team[field];
            if (team[field] === "None" && answer[field] !== "None") {
                box.textContent += " ↑";
            } else if (team[field] !== "None" && answer[field] === "None") {
                box.textContent += " ↓";
            } else if (team[field] !== "None" && answer[field] !== "None") {
                if (parseInt(team[field]) < parseInt(answer[field])) {
                    box.textContent += " ↑";
                } else if (parseInt(team[field]) > parseInt(answer[field])) {
                    box.textContent += " ↓";
                }
            }
        }
    });
}

function clearGuesses() {
    document.getElementById("result").textContent = "";
    document.getElementById("team-input").value = "";
    gotCorrect = false;
    gotWrong = false;
    const guessContainers = document.querySelectorAll(".guess-row-container");
    guessContainers.forEach(container => {
        const teamNameBox = container.querySelector(".team-name-box");
        const guessBoxes = container.querySelectorAll(".guess-box");

        teamNameBox.textContent = `Guess #${Array.from(guessContainers).indexOf(container) + 1}`;

        teamNameBox.classList.add("placeholder");

        guessBoxes.forEach(box => {
            box.className = "guess-box placeholder";
            box.removeAttribute("data-full");
            box.innerHTML = "";
        });
    });
}

function randomizeGame() {
    if (!isRandomMode) {
        return;
    }
    startRandomGame();
}

function saveDailyGameState() {
    const today = getEasternDate();
    const key = `dailyGame-${today.year}-${today.month}-${today.day}`;
    const state = {
        answer: {
            name: answer.name
        },
        guessedTeams: Array.from(guessedTeams),
        correctFilters,
        incorrectFilters: {
            league: Array.from(incorrectFilters.league),
            sport: Array.from(incorrectFilters.sport),
        },
        gotCorrect,
        gotWrong
    };
    localStorage.setItem(key, JSON.stringify(state));
}

function loadDailyGameState() {
    const today = getEasternDate();
    const key = `dailyGame-${today.year}-${today.month}-${today.day}`;
    const stored = localStorage.getItem(key);
    if (!stored) {
        return false;
    }
    try {
        const state = JSON.parse(stored);
        clearGuesses();
        answer = teams.find(t => t.name === state.answer.name);
        guessedTeams = state.guessedTeams;
        correctFilters = {
            league: typeof state.correctFilters.league === "string" ? state.correctFilters.league : null,
            sport: typeof state.correctFilters.sport === "string" ? state.correctFilters.sport : null
        };
        incorrectFilters = {
            league: new Set(state.incorrectFilters.league),
            sport: new Set(state.incorrectFilters.sport),
        };
        gotCorrect = state.gotCorrect;
        gotWrong = state.gotWrong;  
        filterSuggestions();
        renderPreviousGuesses();
        if (guessedTeams.length === maxGuesses) {
            showResultModal(gotCorrect);
        }
        return true;
    } catch (e) {
        console.error("Failed to load saved game", e);
        return false;
    }
}

const colorMap = {
  "Red": "#FF0000",
  "Yellow": "#FFFF00",
  "Black": "#000000",
  "Green": "#008000",
  "Blue": "#0000FF",
  "Purple": "#800080",
  "Gray": "#808080",
  "Orange": "#FFA500",
  "White": "#FFFFFF",
  "Gold": "#FFD700",
  "Teal": "#008080"
};

window.addEventListener("DOMContentLoaded", () => {
    filterSuggestions();
    startDailyGame();
    refreshAbbreviations();
});

window.addEventListener("resize", refreshAbbreviations);

function filterSuggestions() {
    const datalist = document.getElementById("team-suggestions");
    datalist.innerHTML = "";

    if (gotCorrect || gotWrong) {
        return;
    }

    const filtered = teams.filter(team => {
        if (guessedTeams.includes(team.name.toLowerCase())) {
            return false;
        }
        for (let field of ["league", "sport"]) {
            if (correctFilters[field] && team[field] !== correctFilters[field]) {
                return false;
            }
            if (incorrectFilters[field].has(team[field])) {
                return false;
            }
        }
        return true;
    });

    filtered.forEach(team => {
        const option = document.createElement("option");
        option.value = team.name;
        datalist.appendChild(option);
    });
}

function updateFilters(team) {
    ["league", "sport"].forEach(field => {
        const guessedValue = team[field];
        const answerValue = answer[field];

        if (guessedValue === answerValue) {
            correctFilters[field] = guessedValue;
            incorrectFilters[field].clear();
        } else if (!correctFilters[field]) {
            incorrectFilters[field].add(guessedValue);
        }
    });
}

function submitGuess() {
    if (!isRandomMode && (gotCorrect || gotWrong)) {
        showResultModal(gotCorrect);
        document.getElementById("team-input").value = "";
        return;
    }
    
    if (guessedTeams.length >= maxGuesses) {
        showResultModal(gotCorrect);
        document.getElementById("team-input").value = "";
        return;
    }

    const input = document.getElementById("team-input").value.trim();
    const team = teams.find(t => t.name.toLowerCase() === input.toLowerCase());
    if (!team) {
        alert("Invalid team!");
        return;
    }

    for (let field of ["league", "sport"]) {
        if (correctFilters[field] && team[field] !== correctFilters[field]) {
            alert(`Invalid guess: This team cannot be the answer.`);
            return;
        }
        if (incorrectFilters[field].has(team[field])) {
            alert(`Invalid guess: This team cannot be the answer.`);
            return;
        }
    }

    const guessRowContainers = document.querySelectorAll(".guess-row-container");
    const currentRowContainer = guessRowContainers[guessedTeams.length];
    const teamNameBox = currentRowContainer.querySelector(".team-name-box");
    const guessBoxes = currentRowContainer.querySelectorAll(".guess-box");
    teamNameBox.textContent = team.name;
    teamNameBox.classList.remove("placeholder");

    const fields = ["state", "colors", "titles", "lastTitle", "league", "conference", "sport"];
    fields.forEach((field, index) => {
        const box = guessBoxes[index];
        box.classList.remove("placeholder");

        if (field == "colors") {
            box.classList.add("colors");
            box.innerHTML = "";
            const [color1, color2] = team[field].split("/");
            const circle1 = document.createElement("span");
            circle1.classList.add("color-circle");
            circle1.style.backgroundColor = colorMap[color1] || "#C0C0C0";
            const circle2 = document.createElement("span");
            circle2.classList.add("color-circle");
            circle2.style.backgroundColor = colorMap[color2] || "#C0C0C0";

            box.appendChild(circle1);
            box.appendChild(circle2);
        } else {
            let value = team[field];
            box.setAttribute("data-full", value);
    
            if (isMobileScreen()) {
                if (field === "conference") {
                    value = abbreviations[field][value] || value;
                    box.textContent = value;
                } else if (field === "sport") {
                    box.innerHTML = "";
                    const img = document.createElement("img");
                    img.src = sportIcons[value] || ""; 
                    img.alt = value;
                    img.style.width = "15px";
                    img.style.height = "15px";
                    box.appendChild(img);
                } else {
                    box.textContent = value;
                }
            } else {
                box.textContent = value;
            }
        }

        if (team[field] === answer[field]) {
            box.classList.add("green");
        } else if (field === "state" && borders[answer.state] && borders[answer.state].includes(team.state)) {
            box.classList.add("yellow");
        } else if (field === "colors" && team[field].split("/").some(color => answer[field].split("/").includes(color))) {
            box.classList.add("yellow");
        } else if (field === "titles" && Math.abs(parseInt(team[field]) - parseInt(answer[field])) <= 3) {
            box.classList.add("yellow");
        } else if (field === "lastTitle" && team[field] !== "None" && answer[field] !== "None" && Math.abs(parseInt(team[field]) - parseInt(answer[field])) <= 5) {
            box.classList.add("yellow");
        } else {
            box.classList.add("gray");
        }

        if (field === "titles") {
            if (parseInt(team[field]) < parseInt(answer[field])) {
                box.textContent += " ↑";
            } else if (parseInt(team[field]) > parseInt(answer[field])) {
                box.textContent += " ↓";
            }
        }
        if (field === "lastTitle") {
            box.textContent = team[field];
            if (team[field] === "None" && answer[field] !== "None") {
                box.textContent += " ↑";
            } else if (team[field] !== "None" && answer[field] === "None") {
                box.textContent += " ↓";
            } else if (team[field] !== "None" && answer[field] !== "None") {
                if (parseInt(team[field]) < parseInt(answer[field])) {
                    box.textContent += " ↑";
                } else if (parseInt(team[field]) > parseInt(answer[field])) {
                    box.textContent += " ↓";
                }
            }
        }
    });
    const isCorrectGuess = team.name === answer.name;
    if (isCorrectGuess) {
        gotCorrect = true;
    }
    guessedTeams.push(team.name.toLowerCase());
    if (!isRandomMode) {
        saveDailyGameState();
    }

    document.getElementById("team-input").value = "";

    updateFilters(team);
    filterSuggestions();

    if (team.name === answer.name) {
        gotCorrect = true;
        showResultModal(true);
        filterSuggestions();
    } else if (guessedTeams.length === maxGuesses) {
        gotWrong = true;
        window.scrollTo({ top: 100, behavior: 'smooth' });
        showResultModal(false);
        filterSuggestions();
    } else {
        const currentRow = document.querySelectorAll(".guess-row-container")[guessedTeams.length - 1];
        if (currentRow) {
            const rect = currentRow.getBoundingClientRect();
            const offset = rect.bottom + window.scrollY;
            const padding = 20;

            window.scrollTo({
                top: offset - window.innerHeight + padding,
                behavior: 'smooth'
            });
        }
    }
}