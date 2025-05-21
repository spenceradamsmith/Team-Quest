const teams = window.teams;
const borders = window.borders;

let isRandomMode = false;
let guesses = 0;
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

startDailyGame();

function toggleMode() {
    isRandomMode = !isRandomMode;

    const modeText = document.getElementById('mode-text');
    const modeIcon = document.getElementById('mode-icon');
    const randomizeContainer = document.getElementById('randomize-container');

    if (isRandomMode) {
        modeText.textContent = "Play Daily";
        modeIcon.src = "https://icons.veryicon.com/png/o/miscellaneous/face-monochrome-icon/calendar-249.png";
        randomizeContainer.style.display = "flex";
        startRandomGame();
    } else {
        modeText.textContent = "Play More";
        modeIcon.src = "https://cdn-icons-png.flaticon.com/128/3114/3114904.png";
        randomizeContainer.style.display = "none";
        startDailyGame();
    }
}

function startRandomGame() {
    guesses = 0;
    answer = teams[Math.floor(Math.random() * teams.length)];
    clearGuesses();
}

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
    guesses = 0;
    clearGuesses();

    const todayET = getEasternDate();
    const seed = todayET.year * 10000 + todayET.month * 100 + todayET.day;
    const rngIndex = seededRandom(seed) % teams.length;
    answer = teams[rngIndex]; 
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

        teamNameBox.textContent = teamNameBox.classList.contains("placeholder")
            ? teamNameBox.textContent
            : "Guess";

        teamNameBox.classList.add("placeholder");

        guessBoxes.forEach(box => {
            box.className = "guess-box placeholder";
            box.textContent = "";
            box.innerHTML = "";
        });
    });
}

function randomizeGame() {
    if (!isRandomMode) {
        return;
    }

    answer = teams[Math.floor(Math.random() * teams.length)];
    guesses = 0;
    clearGuesses();
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
});

function filterSuggestions() {
    const datalist = document.getElementById("team-suggestions");
    datalist.innerHTML = "";

    const filtered = teams.filter(team => {
        for (let field of ["league", "sport"]) {
            if (correctFilters[field] && team[field] !== correctFilters[field]) return false;
            if (incorrectFilters[field].has(team[field])) return false;
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
    if (guesses >= maxGuesses) {
        return;
    }

    if (gotCorrect) {
        alert("You already got it correct!");
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
    const currentRowContainer = guessRowContainers[guesses];
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
            box.textContent = team[field];
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
    guesses++;
    document.getElementById("team-input").value = "";

    updateFilters(team);
    filterSuggestions();

    if (team.name === answer.name) {
        gotCorrect = true;
        document.getElementById("result").textContent = `You got it in ${guesses} guesses!`;
    } else if (guesses === maxGuesses) {
        gotWrong = true;
        document.getElementById("result").textContent = `Game over! It was the ${answer.name}.`;
    }

}