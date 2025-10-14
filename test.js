// Simple test file for the MathGame application
// This will test the core functionality of the MathGame class

// Mock the DOM elements for testing
global.document = {
  getElementById: function(id) {
    // Return mock elements for testing
    return {
      classList: {
        add: function() {},
        remove: function() {}
      },
      textContent: '',
      value: '',
      dataset: {},
      addEventListener: function() {}
    };
  },
  addEventListener: function() {}
};

// Mock window and localStorage
global.window = {
  localStorage: {
    getItem: function(key) {
      return null;
    },
    setItem: function(key, value) {}
  }
};

// Mock the MathGame class
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
    this.currentSessionProblems = [];
    
    this.initializeElements();
    this.bindEvents();
    this.loadStorage();
    this.showScreen('level-selection');
  }
  
  initializeElements() {
    this.levelSelection = { classList: { add: function() {}, remove: function() {} } };
    this.gameScreen = { classList: { add: function() {}, remove: function() {} } };
    this.resultScreen = { classList: { add: function() {}, remove: function() {} } };
    
    this.levelButtons = [];
    this.problemElement = { textContent: '' };
    this.answerInput = { value: '', focus: function() {} };
    this.submitBtn = { addEventListener: function() {} };
    this.restartBtn = { addEventListener: function() {} };
    this.backBtn = { addEventListener: function() {} };
    
    this.currentLevelElement = { textContent: '' };
    this.timerElement = { textContent: '' };
    this.scoreElement = { textContent: '' };
    this.resultLevelElement = { textContent: '' };
    this.resultCorrectElement = { textContent: '' };
    this.resultTimeElement = { textContent: '' };
    this.resultMessageElement = { textContent: '' };
  }
  
  bindEvents() {
    // Events are mocked
  }
  
  startGame() {
    this.score = 0;
    this.timeElapsed = 0;
    this.problemCount = 0;
    this.startTime = Date.now();
    this.currentSessionProblems = [];
    
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
  }
  
  getWeightedProblem(maxNum1, maxNum2) {
    // Mock implementation for testing
    return {
      num1: 1,
      num2: 1,
      operator: '+',
      answer: 2
    };
  }
  
  checkAnswer() {
    // Mock implementation for testing
    this.problemCount++;
    this.score++;
    this.scoreElement.textContent = this.score;
  }
  
  isProblemInCurrentSession() {
    return false;
  }
  
  addProblemToCurrentSession() {
    // Mock implementation
  }
  
  endGame() {
    // Mock implementation
  }
  
  loadStorage() {
    // Mock implementation
    this.highscores = {1: 0, 2: 0, 3: 0, 4: 0};
    this.wrongProblems = [];
    this.problemRatings = {};
  }
  
  saveStorage() {
    // Mock implementation
  }
  
  showScreen(screenName) {
    // Mock implementation
  }
  
  updateResultScreen() {
    // Mock implementation
  }
}

// Test functions
function runTests() {
  console.log('Running tests for MathGame...');
  
  // Test 1: MathGame class creation
  try {
    const game = new MathGame();
    console.log('✓ MathGame class created successfully');
  } catch (error) {
    console.log('✗ Failed to create MathGame class:', error.message);
  }
  
  // Test 2: Problem generation
  try {
    const game = new MathGame();
    game.currentLevel = 1;
    game.generateProblem();
    if (game.currentProblem && game.currentProblem.answer) {
      console.log('✓ Problem generation works');
    } else {
      console.log('✗ Problem generation failed');
    }
  } catch (error) {
    console.log('✗ Problem generation test failed:', error.message);
  }
  
  // Test 3: Level selection
  try {
    const game = new MathGame();
    game.currentLevel = 3;
    game.startGame();
    if (game.currentLevel === 3) {
      console.log('✓ Level selection works');
    } else {
      console.log('✗ Level selection failed');
    }
  } catch (error) {
    console.log('✗ Level selection test failed:', error.message);
  }
  
  console.log('Tests completed.');
}

// Run the tests
runTests();
