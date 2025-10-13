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
        
        this.initializeElements();
        this.bindEvents();
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
                break;
                
            case 2: // Addition und Subtraktion bis 100
                num1 = Math.floor(Math.random() * 100) + 1;
                num2 = Math.floor(Math.random() * 100) + 1;
                operator = Math.random() > 0.5 ? '+' : '-';
                answer = operator === '+' ? num1 + num2 : num1 - num2;
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
        
        if (userAnswer === this.currentProblem.answer) {
            this.score++;
            this.scoreElement.textContent = this.score;
        }
        
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
        }
    }
}

// Spiel initialisieren, wenn die Seite geladen ist
document.addEventListener('DOMContentLoaded', () => {
    new MathGame();
});
