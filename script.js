document.addEventListener('DOMContentLoaded', function() {
    // Quiz variables
    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let timer;
    const timePerQuestion = 15;
    
    // DOM elements
    const quizSetup = document.getElementById('quiz-setup');
    const quizInterface = document.getElementById('quiz-interface');
    const quizResults = document.getElementById('quiz-results');
    const startBtn = document.getElementById('start-btn');
    const retryBtn = document.getElementById('retry-btn');
    const countSlider = document.getElementById('question-count');
    const countDisplay = document.getElementById('count-display');
    
    // Initialize
    if (countSlider && countDisplay) {
        countSlider.addEventListener('input', function() {
            countDisplay.textContent = this.value;
        });
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', startQuiz);
    }
    
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            location.reload();
        });
    }
    
    // Start quiz function
    function startQuiz() {
        const username = document.getElementById('username').value.trim();
        if (!username) {
            alert('Please enter your name to start the quiz.');
            return;
        }
        
        const category = document.getElementById('category').value;
        const questionCount = document.getElementById('question-count').value;
        
        fetch('/get_questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category: category,
                count: questionCount
            })
        })
        .then(response => response.json())
        .then(data => {
            questions = data;
            quizSetup.style.display = 'none';
            quizInterface.style.display = 'block';
            showQuestion();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load questions. Please try again.');
        });
    }
    
    // Show question function
    function showQuestion() {
        if (currentQuestionIndex >= questions.length) {
            endQuiz();
            return;
        }
        
        const question = questions[currentQuestionIndex];
        const questionText = document.getElementById('question-text');
        const optionsContainer = document.getElementById('options-container');
        const questionCounter = document.getElementById('question-counter');
        const currentScore = document.getElementById('current-score');
        
        // Update UI
        questionText.textContent = question.question;
        questionCounter.textContent = `Question: ${currentQuestionIndex + 1}/${questions.length}`;
        currentScore.textContent = `Score: ${score}`;
        
        // Clear previous options
        optionsContainer.innerHTML = '';
        
        // Create option buttons
        question.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => selectAnswer(option));
            optionsContainer.appendChild(button);
        });
        
        // Start timer
        startTimer();
    }
    
    // Select answer function
    function selectAnswer(selectedOption) {
        clearInterval(timer);
        
        const question = questions[currentQuestionIndex];
        const options = document.querySelectorAll('.option-btn');
        
        // Disable all options
        options.forEach(option => {
            option.disabled = true;
            
            // Highlight correct and incorrect answers
            if (option.textContent === question.correct_answer) {
                option.classList.add('correct');
            } else if (option.textContent === selectedOption && selectedOption !== question.correct_answer) {
                option.classList.add('incorrect');
            }
        });
        
        // Update score if correct
        if (selectedOption === question.correct_answer) {
            score++;
            document.getElementById('current-score').textContent = `Score: ${score}`;
        }
        
        // Move to next question after delay
        setTimeout(() => {
            currentQuestionIndex++;
            showQuestion();
        }, 1500);
    }
    
    // Timer function
    function startTimer() {
        let timeLeft = timePerQuestion;
        updateTimerDisplay(timeLeft);
        
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                selectAnswer(null); // Timeout counts as wrong answer
            }
        }, 1000);
    }
    
    function updateTimerDisplay(time) {
        const progressBar = document.getElementById('progress-bar');
        const percentage = (time / timePerQuestion) * 100;
        progressBar.style.width = `${percentage}%`;
        progressBar.style.backgroundColor = percentage > 50 ? '#4CAF50' : percentage > 20 ? '#FFC107' : '#F44336';
    }
    
    // End quiz function
    function endQuiz() {
        quizInterface.style.display = 'none';
        quizResults.style.display = 'block';
        
        const resultDetails = document.getElementById('result-details');
        const username = document.getElementById('username').value.trim();
        
        resultDetails.innerHTML = `
            <p>Congratulations, ${username || 'Quizzer'}!</p>
            <p>Your final score: <strong>${score}/${questions.length}</strong></p>
            <p>Percentage: <strong>${Math.round((score / questions.length) * 100)}%</strong></p>
        `;
        
        // Save score
        fetch('/save_score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                score: score,
                total: questions.length,
                category: document.getElementById('category').value
            })
        });
    }
});