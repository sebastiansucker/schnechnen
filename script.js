class MathGame {
    constructor() {
        this.currentLevel = 0;
        this.currentProblem = null;
        this.score = 0;
        this.startTime = 0;
        this.timer = null;
        this.timeElapsed = 0;
        this.problemCount = 0;
        this.maxProblems = 10;
        this.wrongProblems = [];
        this.problemRatings = {};
        
        this.initializeElements();
        this.bindEvents();
        this.loadStorage();
        this.showScreen('level-selection');
    }
    
    initializeElements() {
        this.levelSelection = document.getElementById('level-selection');
        this.gameScreen = document.getElementById('game-screen');
        this.resultScreen = document.getElementById('result-screen');
        
        this.levelButtons = document.querySelectorAll('.level-btn');
        this.problemElement = document.getElementById('problem');
        this.answerInput = document.getElementById('answer');
        this.submitBtn = document.getElementById('submit-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.backBtn = document.getElementById('back-btn');
        
        this.currentLevelElement = document.getElementById('current-level');
        this.timerElement = document.getElementById('timer');
        this.scoreElement = document.getElementById('score');
        this.resultLevelElement = document.getElementById('result-level');
        this.resultCorrectElement = document.getElementById('result-correct');
        this.resultTimeElement = document.getElementById('result-time');
        this.resultMessageElement = document.getElementById('result-message');
    }
    
    bindEvents() {
        // Level Auswahl
        this.levelButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.currentLevel = parseInt(e.target.dataset.level);
                this.startGame();
            });
        });
        
        // Spiel Events
        this.submitBtn.addEventListener('click', () => {
            this.checkAnswer();
        });
        
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });
        
        // Neues Spiel
        this.restartBtn.addEventListener('click', () => {
            this.showScreen('level-selection');
        });
        
        // Zurück zur Level-Auswahl
        this.backBtn.addEventListener('click', () => {
            this.showScreen('level-selection');
        });
    }
    
    startGame() {
        this.score = 0;
        this.timeElapsed = 0;
        this.problemCount = 0;
        this.startTime = Date.now();
        
        this.updateTimer();
        this.timer = setInterval(() => {
            this.updateTimer();
        }, 1000);
        
        this.currentLevelElement.textContent = this.currentLevel;
        this.scoreElement.textContent = this.score;
        this.showScreen('game-screen');
        this.generateProblem();
    }
    
    updateTimer() {
        this.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.timerElement.textContent = this.timeElapsed;
    }
    
    generateProblem() {
        if (this.problemCount >= this.maxProblems) {
            this.endGame();
            return;
        }
        
        let num1, num2, operator, answer;
        
        switch (this.currentLevel) {
            case 1: // Addition und Subtraktion bis 10
                num1 = Math.floor(Math.random() * 10) + 1;
                num2 = Math.floor(Math.random() * 10) + 1;
                operator = Math.random() > 0.5 ? '+' : '-';
                answer = operator === '+' ? num1 + num2 : num1 - num2;
                // Ensure result is greater than 0 for levels 1 and 2
                if (answer <= 0) {
                    // If result is not greater than 0, regenerate until it is
                    this.generateProblem();
                    return;
                }
                break;
                
            case 2: // Addition und Subtraktion bis 100
                num1 = Math.floor(Math.random() * 100) + 1;
                num2 = Math.floor(Math.random() * 100) + 1;
                operator = Math.random() > 0.5 ? '+' : '-';
                answer = operator === '+' ? num1 + num2 : num1 - num2;
                // Ensure result is greater than 0 for levels 1 and 2
                if (answer <= 0) {
                    // If result is not greater than 0, regenerate until it is
                    this.generateProblem();
                    return;
                }
                break;
                
            case 3: // Multiplikation bis 100
                num1 = Math.floor(Math.random() * 10) + 1;
                num2 = Math.floor(Math.random() * 10) + 1;
                operator = '×';
                answer = num1 * num2;
                break;
                
            case 4: // Multiplikation und Division bis 100
                if (Math.random() > 0.5) {
                    // Multiplikation
                    num1 = Math.floor(Math.random() * 10) + 1;
                    num2 = Math.floor(Math.random() * 10) + 1;
                    operator = '×';
                    answer = num1 * num2;
                } else {
                    // Division (mit Ergebnis, das eine ganze Zahl ist)
                    num2 = Math.floor(Math.random() * 10) + 1;
                    answer = Math.floor(Math.random() * 10) + 1;
                    num1 = num2 * answer;
                    operator = '÷';
                }
                break;
        }
        
        this.currentProblem = {
            num1: num1,
            num2: num2,
            operator: operator,
            answer: answer
        };
        
        this.problemElement.textContent = `${num1} ${operator} ${num2} = ?`;
        this.answerInput.value = '';
        this.answerInput.focus();
    }
    
    checkAnswer() {
        const userAnswer = parseInt(this.answerInput.value);
        
        if (isNaN(userAnswer)) {
            alert('Bitte geben Sie eine Zahl ein!');
            return;
        }
        
        this.problemCount++;
        
        // Track wrong problems
        if (userAnswer !== this.currentProblem.answer) {
            // Create problem identifier
            const problemId = `${this.currentProblem.num1}${this.currentProblem.operator}${this.currentProblem.num2}`;
            
            // Update wrong problems tracking
            const wrongProblemIndex = this.wrongProblems.findIndex(p => 
                p.num1 === this.currentProblem.num1 && 
                p.num2 === this.currentProblem.num2 && 
                p.operator === this.currentProblem.operator
            );
            
            if (wrongProblemIndex === -1) {
                // New wrong problem
                this.wrongProblems.push({
                    num1: this.currentProblem.num1,
                    num2: this.currentProblem.num2,
                    operator: this.currentProblem.operator,
                    count: 1
                });
            } else {
                // Existing wrong problem, increment count
                this.wrongProblems[wrongProblemIndex].count++;
            }
            
            // Update problem rating
            if (!this.problemRatings[problemId]) {
                this.problemRatings[problemId] = 1;
            } else {
                this.problemRatings[problemId]++;
            }
        } else {
            // Correct answer - decrease rating
            const problemId = `${this.currentProblem.num1}${this.currentProblem.operator}${this.currentProblem.num2}`;
            if (this.problemRatings[problemId]) {
                this.problemRatings[problemId] = Math.max(0, this.problemRatings[problemId] - 0.5);
            }
        }
        
        if (userAnswer === this.currentProblem.answer) {
            this.score++;
            this.scoreElement.textContent = this.score;
        }
        
        // Save storage after each answer
        this.saveStorage();
        
        // Warte kurz, bevor die nächste Aufgabe angezeigt wird
        setTimeout(() => {
            this.generateProblem();
        }, 500);
    }
    
    endGame() {
        clearInterval(this.timer);
        
        this.resultLevelElement.textContent = this.currentLevel;
        this.resultCorrectElement.textContent = this.score;
        this.resultTimeElement.textContent = this.timeElapsed;
        
        // Update highscore if this is a new highscore
        if (this.score > this.highscores[this.currentLevel]) {
            this.highscores[this.currentLevel] = this.score;
            this.saveStorage();
        }
        
        // Ergebnisnachricht basierend auf der Punktzahl
        let message = '';
        const percentage = (this.score / this.maxProblems) * 100;
        
        if (percentage >= 90) {
            message = 'Ausgezeichnet! 🎉';
        } else if (percentage >= 70) {
            message = 'Sehr gut! 👍';
        } else if (percentage >= 50) {
            message = 'Gut gemacht! 👌';
        } else {
            message = 'Nächstes Mal geht es besser! 💪';
        }
        
        this.resultMessageElement.textContent = message;
        this.showScreen('result-screen');
    }
    
    loadStorage() {
        // Load highscores
        const highscores = localStorage.getItem('mathGameHighscores');
        if (highscores) {
            this.highscores = JSON.parse(highscores);
        } else {
            this.highscores = {1: 0, 2: 0, 3: 0, 4: 0};
        }
        
        // Load wrong problems
        const wrongProblems = localStorage.getItem('mathGameWrongProblems');
        if (wrongProblems) {
            this.wrongProblems = JSON.parse(wrongProblems);
        } else {
            this.wrongProblems = [];
        }
        
        // Load problem ratings
        const problemRatings = localStorage.getItem('mathGameProblemRatings');
        if (problemRatings) {
            this.problemRatings = JSON.parse(problemRatings);
        } else {
            this.problemRatings = {};
        }
    }
    
    saveStorage() {
        // Save highscores
        localStorage.setItem('mathGameHighscores', JSON.stringify(this.highscores));
        
        // Save wrong problems
        localStorage.setItem('mathGameWrongProblems', JSON.stringify(this.wrongProblems));
        
        // Save problem ratings
        localStorage.setItem('mathGameProblemRatings', JSON.stringify(this.problemRatings));
    }
    
    showScreen(screenName) {
        // Alle Screens ausblenden
        this.levelSelection.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.resultScreen.classList.add('hidden');
        
        // Angegebenen Screen anzeigen
        if (screenName === 'level-selection') {
            this.levelSelection.classList.remove('hidden');
        } else if (screenName === 'game-screen') {
            this.gameScreen.classList.remove('hidden');
        } else if (screenName === 'result-screen') {
            this.resultScreen.classList.remove('hidden');
            
            // Update result screen with highscores and wrong problems
            this.updateResultScreen();
        }
    }
    
    updateResultScreen() {
        // Update highscores
        document.getElementById('highscore-1').textContent = this.highscores[1];
        document.getElementById('highscore-2').textContent = this.highscores[2];
        document.getElementById('highscore-3').textContent = this.highscores[3];
        document.getElementById('highscore-4').textContent = this.highscores[4];
        
        // Update wrong problems
        const wrongProblemsList = document.getElementById('wrong-problems-list');
        wrongProblemsList.innerHTML = '';
        
        if (this.wrongProblems.length === 0) {
            wrongProblemsList.innerHTML = '<p>Keine häufig falsch beantworteten Aufgaben.</p>';
        } else {
            // Sort wrong problems by count (descending)
            const sortedWrongProblems = [...this.wrongProblems].sort((a, b) => b.count - a.count);
            
            sortedWrongProblems.forEach(problem => {
                const problemElement = document.createElement('p');
                problemElement.textContent = `${problem.num1} ${problem.operator} ${problem.num2} = ? (Falsch: ${problem.count}x)`;
                wrongProblemsList.appendChild(problemElement);
            });
        }
    }
}

// Spiel initialisieren, wenn die Seite geladen ist
document.addEventListener('DOMContentLoaded', () => {
    new MathGame();
});
