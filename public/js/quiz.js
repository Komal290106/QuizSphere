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
    
    // Track if quiz is completed
    let isQuizCompleted = false;
    // Track if user confirmed leaving
    let isLeavingConfirmed = false;
    
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
    
    // ============ CREATE LEAVE WARNING MODAL ============
    
    // Create leave warning modal
    const leaveModal = document.createElement('div');
    leaveModal.className = 'leave-warning-modal';
    leaveModal.id = 'leave-warning-modal';
    leaveModal.innerHTML = `
        <div class="leave-warning-content">
            <div class="leave-warning-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Wait! Are you sure?</h2>
                <p>Your progress will be lost if you leave</p>
            </div>
            <div class="leave-warning-body">
                <div class="warning-stats" id="warning-stats">
                    <div class="warning-stat-item">
                        <div class="warning-stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="warning-stat-info">
                            <span class="warning-stat-label">Questions Attempted</span>
                            <span class="warning-stat-value" id="warning-attempted">0</span>
                        </div>
                    </div>
                    <div class="warning-stat-item">
                        <div class="warning-stat-icon">
                            <i class="fas fa-flag"></i>
                        </div>
                        <div class="warning-stat-info">
                            <span class="warning-stat-label">Marked for Review</span>
                            <span class="warning-stat-value" id="warning-marked">0</span>
                        </div>
                    </div>
                    <div class="warning-stat-item">
                        <div class="warning-stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="warning-stat-info">
                            <span class="warning-stat-label">Time Remaining</span>
                            <span class="warning-stat-value highlight" id="warning-time">00:00</span>
                        </div>
                    </div>
                </div>
                <div class="warning-progress-bar">
                    <div class="warning-progress-fill" id="warning-progress" style="width: 0%"></div>
                </div>
                <div class="warning-message-box">
                    <i class="fas fa-info-circle"></i>
                    <span>If you leave now, all your answers will be lost and progress cannot be recovered.</span>
                </div>
            </div>
            <div class="leave-warning-footer">
                <button class="leave-warning-btn stay" id="stay-on-quiz">
                    <i class="fas fa-arrow-left"></i> Stay on Quiz
                </button>
                <button class="leave-warning-btn leave" id="leave-anyway">
                    Leave Anyway <i class="fas fa-external-link-alt"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(leaveModal);
    
    // Create tab warning banner
    const tabBanner = document.createElement('div');
    tabBanner.className = 'tab-warning-banner';
    tabBanner.id = 'tab-warning-banner';
    tabBanner.innerHTML = `
        <i class="fas fa-eye-slash"></i>
        <span>Don't switch tabs during the quiz! Your progress may not be saved.</span>
    `;
    document.body.appendChild(tabBanner);
    
    // Leave modal elements
    const leaveModalEl = document.getElementById('leave-warning-modal');
    const stayBtn = document.getElementById('stay-on-quiz');
    const leaveBtn = document.getElementById('leave-anyway');
    const warningAttempted = document.getElementById('warning-attempted');
    const warningMarked = document.getElementById('warning-marked');
    const warningTime = document.getElementById('warning-time');
    const warningProgress = document.getElementById('warning-progress');
    const tabBannerEl = document.getElementById('tab-warning-banner');
    
    // ============ LEAVE WARNING FUNCTIONS ============

    // Update warning stats
    function updateWarningStats() {
        const attempted = answers.filter(a => a !== null && a !== undefined).length;
        const marked = markedForReview.filter(m => m).length;
        
        // Format time
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update modal
        if (warningAttempted) warningAttempted.textContent = attempted;
        if (warningMarked) warningMarked.textContent = marked;
        if (warningTime) warningTime.textContent = timeStr;
        
        // Update progress bar (based on attempted questions)
        const progress = (attempted / questions.length) * 100;
        if (warningProgress) warningProgress.style.width = `${progress}%`;
    }

    // Show leave warning modal
    function showLeaveWarning(leaveAction) {
        if (isQuizCompleted || totalTime <= 0 || isLeavingConfirmed) return;
        
        const hasAnswers = answers.some(ans => ans !== null && ans !== undefined);
        if (!hasAnswers) {
            // No answers, just leave
            executeLeaveAction(leaveAction);
            return;
        }
        
        // Update stats and show modal
        updateWarningStats();
        leaveModalEl.classList.add('show');
        
        // Store the leave action to execute if user confirms
        leaveModalEl.dataset.leaveAction = leaveAction;
    }

    // Execute leave action
    function executeLeaveAction(action) {
        console.log('Executing leave action:', action);
        
        // Set flag to prevent further protection
        isLeavingConfirmed = true;
        
        setTimeout(() => {
            if (action === 'back') {
                window.history.go(-1);
            } 
            else if (action === 'refresh') {
                window.location.reload();
            } 
            else if (action === 'home') {
                window.location.href = '/';
            }
            else if (action === 'quiz-list') {
                window.location.href = '/quiz';
            }
            else if (action === 'close') {
                try {
                    window.close();
                } catch(e) {
                    console.log('Could not close window, redirecting instead');
                }
                setTimeout(() => {
                    window.location.href = '/quiz';
                }, 100);
            }
        }, 50);
    }

    // Stay on quiz
    stayBtn.addEventListener('click', () => {
        leaveModalEl.classList.remove('show');
    });

    // Leave anyway
    leaveBtn.addEventListener('click', () => {
        const action = leaveModalEl.dataset.leaveAction || 'back';
        console.log('Leave button clicked, action:', action);
        
        leaveModalEl.classList.remove('show');
        executeLeaveAction(action);
    });

    // Close modal when clicking outside
    leaveModalEl.addEventListener('click', (e) => {
        if (e.target === leaveModalEl) {
            leaveModalEl.classList.remove('show');
        }
    });

    // ============ PAGE LEAVE PROTECTION ============

    // Track if we're currently leaving
    let isLeaving = false;

    // Handle browser back button
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', function () {
        if (isLeaving || isLeavingConfirmed) return;
        
        if (!isQuizCompleted && totalTime > 0) {
            const hasAnswers = answers.some(ans => ans !== null && ans !== undefined);
            
            if (hasAnswers) {
                history.pushState(null, null, location.href);
                showLeaveWarning('back');
            }
        }
    });

    // Handle page visibility change (switching tabs)
    document.addEventListener('visibilitychange', function() {
        if (isLeavingConfirmed) return;
        
        if (document.hidden && !isQuizCompleted && totalTime > 0) {
            const hasAnswers = answers.some(ans => ans !== null && ans !== undefined);
            
            if (hasAnswers) {
                tabBannerEl.classList.add('show');
                
                setTimeout(() => {
                    tabBannerEl.classList.remove('show');
                }, 3000);
                
                updateWarningStats();
            }
        }
    });

    // Prevent keyboard shortcuts (Ctrl+W, Ctrl+R, F5)
    window.addEventListener('keydown', function(e) {
        if (isLeavingConfirmed) return;
        
        if (isQuizCompleted || totalTime <= 0) return;
        
        const hasAnswers = answers.some(ans => ans !== null && ans !== undefined);
        if (!hasAnswers) return;
        
        if ((e.ctrlKey && (e.key === 'w' || e.key === 'r')) || e.key === 'F5') {
            e.preventDefault();
            
            let action = 'refresh';
            if (e.key === 'w') action = 'close';
            
            showLeaveWarning(action);
        }
        
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            showLeaveWarning('back');
        }
    });

    // Prevent link clicks
    document.addEventListener('click', function(e) {
        if (isLeavingConfirmed) return;
        
        if (isQuizCompleted || totalTime <= 0) return;
        
        const link = e.target.closest('a');
        if (link) {
            const hasAnswers = answers.some(ans => ans !== null && ans !== undefined);
            
            if (hasAnswers) {
                const isInternal = link.hostname === window.location.hostname || 
                                  link.getAttribute('href').startsWith('/') ||
                                  link.getAttribute('href').startsWith('#');
                
                if (!isInternal) {
                    e.preventDefault();
                    showLeaveWarning('home');
                } else {
                    const href = link.getAttribute('href');
                    
                    if (href.includes('/quiz/') && href.includes('/attempt')) {
                        e.preventDefault();
                        showLeaveWarning('quiz-list');
                    } else if (href === '/quiz' || href === '/dashboard' || href === '/profile') {
                        e.preventDefault();
                        showLeaveWarning('quiz-list');
                    }
                }
            }
        }
    });

    // Block header/footer navigation
    document.addEventListener('click', function(e) {
        const header = e.target.closest('header');
        const footer = e.target.closest('footer');
        
        if ((header || footer) && !isQuizCompleted && totalTime > 0 && !isLeavingConfirmed) {
            const hasAnswers = answers.some(ans => ans !== null && ans !== undefined);
            
            if (hasAnswers) {
                const link = e.target.closest('a');
                if (link) {
                    e.preventDefault();
                    e.stopPropagation();
                    showLeaveWarning('quiz-list');
                }
            }
        }
    }, true);

    // ============ RESULT MODAL ============
    
    // Create result modal elements
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
    
    // ============ QUIZ FUNCTIONS ============
    
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
        console.log(`Question ${currentQuestionIndex + 1} answered: ${optionIndex}`);
        
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
        console.log(`Question ${currentQuestionIndex + 1} cleared`);
        
        document.querySelectorAll('.option-item').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        if (!markedForReview[currentQuestionIndex]) {
            updateQuestionStatus(currentQuestionIndex, 'not-visited');
        }
    });
    
    // Timer
    function startTimer() {
        timerInterval = setInterval(() => {
            if (totalTime <= 0) {
                clearInterval(timerInterval);
                isQuizCompleted = true;
                showResultModal(true);
                return;
            }
            
            totalTime--;
            
            const hours = Math.floor(totalTime / 3600);
            const minutes = Math.floor((totalTime % 3600) / 60);
            const seconds = totalTime % 60;
            
            timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
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
        isQuizCompleted = true;
        
        const results = calculateResults();
        
        modalTotal.textContent = results.total;
        modalAttempted.textContent = results.attempted;
        modalCorrect.textContent = results.correct;
        modalMarked.textContent = results.marked;
        modalScore.textContent = `${results.percentage}%`;
        
        modalScoreCircle.style.background = `conic-gradient(#7BA7F2 0% ${results.percentage}%, #e0e8f0 ${results.percentage}% 100%)`;
        
        modal.classList.add('show');
        
        const answersString = answers.map(ans => ans !== null && ans !== undefined ? ans : '-1').join(',');
        
        viewResultsBtn.onclick = () => {
            window.location.href = `/result/${quizId}?answers=${answersString}`;
        };
        
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