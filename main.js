const teams = window.teams;
const borders = window.borders;

let guesses = 0;
const maxGuesses = 8;
const answer = teams[Math.floor(Math.random() * teams.length)];

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
    const datalist = document.getElementById("team-suggestions");
    teams.forEach(team => {
        const option = document.createElement("option");
        option.value = team.name;
        datalist.appendChild(option);
    })
});

function submitGuess() {
    if (guesses >= maxGuesses) {
        return;
    }
    const input = document.getElementById("team-input").value.trim();
    const team = teams.find(t => t.name.toLowerCase() === input.toLowerCase());
    if (!team) {
        alert("Invalid team!");
        return;
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
            const teamTitles = String(team[field]);
            const answerTitles = String(answer[field]);
            box.textContent = teamTitles;
            if (teamTitles === "None" && answerTitles !== "None") {
                box.textContent = "None ↑";
            } else if (teamTitles !== "None" && answerTitles === "None") {
                box.textContent += " ↓";
            } else if (teamTitles !== "None" && answerTitles !== "None") {
                if (parseInt(teamTitles) < parseInt(answerTitles)) {
                    box.textContent += " ↑";
                } else if (parseInt(teamTitles) > parseInt(answerTitles)) {
                    box.textContent += " ↓";
                }
            }
        }
    });
    guesses++;
    document.getElementById("team-input").value = "";

    if (team.name === answer.name) {
        document.getElementById("result").textContent = `You got it in ${guesses} guesses!`;
    } else if (guesses === maxGuesses) {
        document.getElementById("result").textContent = `Game over! It was the ${answer.name}.`;
    }
}