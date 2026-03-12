document.addEventListener('DOMContentLoaded', function() {
    // Quiz state
    let currentQuestionIndex = 0;
    let questions = window.quizData.questions;
    let totalTime = window.quizData.totalTime;
    let quizId = window.quizData.quizId;
    let timerInterval;
    let answers = new Array(questions.length).fill(null);
    let questionStatus = new Array(questions.length).fill('not-visited');
    let markedForReview = new Array(questions.length).fill(false);
    
    // DOM elements
    const questionNumberEl = document.getElementById('question-number');
    const questionContentEl = document.getElementById('question-content');
    const paletteGrid = document.getElementById('palette-grid');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const markBtn = document.getElementById('mark-btn');
    const clearBtn = document.getElementById('clear-btn');
    const submitBtn = document.getElementById('submit-quiz');
    const timerEl = document.getElementById('timer');
    
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'result-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <i class="fas fa-trophy"></i>
                <h2>Quiz Completed!</h2>
            </div>
            <div class="modal-body">
                <div class="modal-stats">
                    <div class="modal-stat">
                        <span class="stat-label">Total Questions</span>
                        <span class="stat-value total" id="modal-total">0</span>
                    </div>
                    <div class="modal-stat">
                        <span class="stat-label">Attempted</span>
                        <span class="stat-value attempted" id="modal-attempted">0</span>
                    </div>
                    <div class="modal-stat">
                        <span class="stat-label">Correct</span>
                        <span class="stat-value correct" id="modal-correct">0</span>
                    </div>
                    <div class="modal-stat">
                        <span class="stat-label">Marked</span>
                        <span class="stat-value marked" id="modal-marked">0</span>
                    </div>
                </div>
                <div class="modal-score">
                    <div class="score-circle" id="modal-score-circle">
                        <span class="score-percentage" id="modal-score">0%</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn view-results" id="view-results-btn">
                    <i class="fas fa-chart-bar"></i> View Detailed Results
                </button>
                <button class="modal-btn close-modal" id="close-modal-btn">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Modal elements
    const modalTotal = document.getElementById('modal-total');
    const modalAttempted = document.getElementById('modal-attempted');
    const modalCorrect = document.getElementById('modal-correct');
    const modalMarked = document.getElementById('modal-marked');
    const modalScore = document.getElementById('modal-score');
    const modalScoreCircle = document.getElementById('modal-score-circle');
    const viewResultsBtn = document.getElementById('view-results-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // Initialize
    function init() {
        createPalette();
        loadQuestion(0);
        startTimer();
        updateQuestionStatus(0, 'current');
    }
    
    // Create question palette
    function createPalette() {
        paletteGrid.innerHTML = '';
        for (let i = 0; i < questions.length; i++) {
            const btn = document.createElement('button');
            btn.className = `palette-btn ${questionStatus[i]}`;
            btn.textContent = i + 1;
            btn.addEventListener('click', () => loadQuestion(i));
            paletteGrid.appendChild(btn);
        }
    }
    
    // Load question
    function loadQuestion(index) {
        // Update status of previous question
        if (currentQuestionIndex !== index) {
            if (markedForReview[currentQuestionIndex]) {
                updateQuestionStatus(currentQuestionIndex, 'marked');
            } else if (answers[currentQuestionIndex] !== null && answers[currentQuestionIndex] !== undefined) {
                updateQuestionStatus(currentQuestionIndex, 'answered');
            } else {
                updateQuestionStatus(currentQuestionIndex, 'not-visited');
            }
        }
        
        currentQuestionIndex = index;
        const question = questions[index];
        
        // Update question number
        questionNumberEl.textContent = `Question ${index + 1} of ${questions.length}`;
        
        // Render question
        renderQuestion(question, index);
        
        // Update current question status
        updateQuestionStatus(index, 'current');
        
        // Update navigation buttons
        updateNavButtons();
        
        // Update mark button state
        if (markedForReview[index]) {
            markBtn.classList.add('marked');
            markBtn.innerHTML = '<i class="fas fa-flag"></i> Marked for Review';
        } else {
            markBtn.classList.remove('marked');
            markBtn.innerHTML = '<i class="fas fa-flag"></i> Mark for Review';
        }
    }
    
    // Render question
    function renderQuestion(question, index) {
        let optionsHtml = '';
        question.options.forEach((option, optIndex) => {
            const isSelected = answers[index] === optIndex;
            optionsHtml += `
                <div class="option-item ${isSelected ? 'selected' : ''}" data-option="${optIndex}">
                    <span class="option-marker">${String.fromCharCode(65 + optIndex)}</span>
                    <span class="option-text">${option}</span>
                </div>
            `;
        });
        
        questionContentEl.innerHTML = `
            <div class="question-text">${question.question}</div>
            <div class="options-container">
                ${optionsHtml}
            </div>
        `;
        
        // Add click handlers to options
        document.querySelectorAll('.option-item').forEach(option => {
            option.addEventListener('click', () => selectOption(parseInt(option.dataset.option)));
        });
    }
    
    // Select option
    function selectOption(optionIndex) {
        answers[currentQuestionIndex] = optionIndex;
        console.log(`Question ${currentQuestionIndex + 1} answered: ${optionIndex}`); // Debug log
        
        // Update UI
        document.querySelectorAll('.option-item').forEach(opt => {
            opt.classList.remove('selected');
            if (parseInt(opt.dataset.option) === optionIndex) {
                opt.classList.add('selected');
            }
        });
        
        // Update status
        if (!markedForReview[currentQuestionIndex]) {
            updateQuestionStatus(currentQuestionIndex, 'answered');
        }
    }
    
    // Update question status
    function updateQuestionStatus(index, status) {
        questionStatus[index] = status;
        const paletteBtns = document.querySelectorAll('.palette-btn');
        if (paletteBtns[index]) {
            paletteBtns[index].className = `palette-btn ${status}`;
        }
    }
    
    // Update navigation buttons
    function updateNavButtons() {
        prevBtn.disabled = currentQuestionIndex === 0;
        
        // Change next button text on last question
        if (currentQuestionIndex === questions.length - 1) {
            nextBtn.innerHTML = 'Submit <i class="fas fa-check-circle"></i>';
        } else {
            nextBtn.innerHTML = 'Save & Next <i class="fas fa-arrow-right"></i>';
        }
    }
    
    // Navigation: Previous
    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            loadQuestion(currentQuestionIndex - 1);
        }
    });
    
    // Navigation: Next
    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            loadQuestion(currentQuestionIndex + 1);
        } else {
            // Last question - show confirmation
            if (confirm('You have reached the last question. Do you want to submit the quiz?')) {
                submitQuiz();
            }
        }
    });
    
    // Mark for Review
    markBtn.addEventListener('click', () => {
        markedForReview[currentQuestionIndex] = !markedForReview[currentQuestionIndex];
        
        if (markedForReview[currentQuestionIndex]) {
            markBtn.classList.add('marked');
            markBtn.innerHTML = '<i class="fas fa-flag"></i> Marked for Review';
            updateQuestionStatus(currentQuestionIndex, 'marked');
        } else {
            markBtn.classList.remove('marked');
            markBtn.innerHTML = '<i class="fas fa-flag"></i> Mark for Review';
            if (answers[currentQuestionIndex] !== null && answers[currentQuestionIndex] !== undefined) {
                updateQuestionStatus(currentQuestionIndex, 'answered');
            } else {
                updateQuestionStatus(currentQuestionIndex, 'not-visited');
            }
        }
    });
    
    // Clear Response
    clearBtn.addEventListener('click', () => {
        answers[currentQuestionIndex] = null;
        console.log(`Question ${currentQuestionIndex + 1} cleared`); // Debug log
        
        // Update UI
        document.querySelectorAll('.option-item').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Update status
        if (!markedForReview[currentQuestionIndex]) {
            updateQuestionStatus(currentQuestionIndex, 'not-visited');
        }
    });
    
    // Timer
    function startTimer() {
        timerInterval = setInterval(() => {
            if (totalTime <= 0) {
                clearInterval(timerInterval);
                showResultModal(true); // true = time's up
                return;
            }
            
            totalTime--;
            
            const hours = Math.floor(totalTime / 3600);
            const minutes = Math.floor((totalTime % 3600) / 60);
            const seconds = totalTime % 60;
            
            timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Change color when less than 5 minutes remaining
            if (totalTime < 300) {
                timerEl.parentElement.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
            }
        }, 1000);
    }
    
    // Calculate results
    function calculateResults() {
        let correct = 0;
        let attempted = 0;
        let marked = 0;
        
        questions.forEach((question, index) => {
            if (answers[index] !== null && answers[index] !== undefined) {
                attempted++;
                if (answers[index] === question.answer) {
                    correct++;
                }
            }
            if (markedForReview[index]) {
                marked++;
            }
        });
        
        console.log('Answers array:', answers); // Debug log
        console.log('Attempted:', attempted, 'Correct:', correct); // Debug log
        
        return {
            total: questions.length,
            attempted,
            correct,
            marked,
            wrong: attempted - correct,
            unattempted: questions.length - attempted,
            percentage: Math.round((correct / questions.length) * 100)
        };
    }
    
    // Show result modal
    function showResultModal(isTimeUp = false) {
        clearInterval(timerInterval);
        
        const results = calculateResults();
        
        // Update modal stats
        modalTotal.textContent = results.total;
        modalAttempted.textContent = results.attempted;
        modalCorrect.textContent = results.correct;
        modalMarked.textContent = results.marked;
        modalScore.textContent = `${results.percentage}%`;
        
        // Update score circle
        modalScoreCircle.style.background = `conic-gradient(#7BA7F2 0% ${results.percentage}%, #e0e8f0 ${results.percentage}% 100%)`;
        
        // Show modal
        modal.classList.add('show');
        
        // Store answers string for redirect - FIXED: Use -1 for unattempted instead of empty string
        const answersString = answers.map(ans => ans !== null && ans !== undefined ? ans : '-1').join(',');
        console.log('Answers string for URL:', answersString); // Debug log
        
        // View results button
        viewResultsBtn.onclick = () => {
            window.location.href = `/result/${quizId}?answers=${answersString}`;
        };
        
        // Close modal button
        closeModalBtn.onclick = () => {
            modal.classList.remove('show');
        };
    }
    
    // Submit Quiz
    function submitQuiz() {
        showResultModal();
    }
    
    submitBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to submit the quiz?')) {
            submitQuiz();
        }
    });
    
    // Initialize the quiz
    init();
});