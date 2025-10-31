// Listening.js - JavaScript for Listening Page

// Global variables
let currentQuizAnswers = {};
let quizSubmitted = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeListeningPage();
});

function initializeListeningPage() {
    setupAudioControls();
    setupQuizInteractions();
    setupToggleButtons();
    restoreSelections(); // Khôi phục trạng thái chọn khi load trang
}

// Setup quiz interactions - FIXED TO PERSIST SELECTIONS
function setupQuizInteractions() {
    const radioButtons = document.querySelectorAll('.quiz-question input[type="radio"]');
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            if (quizSubmitted) return;
            
            const questionId = this.closest('.quiz-question').getAttribute('data-question');
            const answerIndex = parseInt(this.value);
            
            console.log(`Question ${questionId} selected: ${answerIndex}`);
            
            // Update selection for this specific question only
            updateQuestionSelection(questionId, answerIndex);
            
            selectAnswer(questionId, answerIndex);
        });
    });
    
    console.log(`Initialized ${radioButtons.length} radio buttons`);
}

// Update visual selection for a specific question
function updateQuestionSelection(questionId, answerIndex) {
    const questionElement = document.querySelector(`[data-question="${questionId}"]`);
    
    if (questionElement) {
        // Remove selected class and custom styles from all options in this question
        const allLabels = questionElement.querySelectorAll('.option-label');
        allLabels.forEach(label => {
            label.classList.remove('selected');
            label.style.borderColor = '';
            label.style.backgroundColor = '';
            label.style.position = '';
            
            // Remove custom checkmark
            const existingCheckmark = label.querySelector('.custom-checkmark');
            if (existingCheckmark) {
                existingCheckmark.remove();
            }
            
            // Reset radio button styling
            const radio = label.querySelector('input[type="radio"]');
            if (radio) {
                radio.style.borderColor = '';
                radio.style.backgroundColor = '';
            }
        });
        
        // Add selected class and custom styles to the chosen option
        const selectedLabel = questionElement.querySelector(`.option-label[data-option="${answerIndex}"]`);
        if (selectedLabel) {
            selectedLabel.classList.add('selected');
            
            // Add custom styling for selected option
            selectedLabel.style.border = '2px solid #2196F3';
            selectedLabel.style.backgroundColor = '#E3F2FD';
            selectedLabel.style.borderRadius = '8px';
            selectedLabel.style.padding = '12px 15px';
            selectedLabel.style.position = 'relative';
            
            // Add custom checkmark
            const checkmark = document.createElement('span');
            checkmark.className = 'custom-checkmark';
            checkmark.innerHTML = '✓';
            checkmark.style.position = 'absolute';
            checkmark.style.right = '15px';
            checkmark.style.top = '50%';
            checkmark.style.transform = 'translateY(-50%)';
            checkmark.style.color = '#2196F3';
            checkmark.style.fontWeight = 'bold';
            checkmark.style.fontSize = '16px';
            
            selectedLabel.appendChild(checkmark);
            
            // Style the radio button
            const radio = selectedLabel.querySelector('input[type="radio"]');
            if (radio) {
                radio.style.borderColor = '#2196F3';
            }
        }
        
        // Mark question as answered
        questionElement.classList.add('answered');
        questionElement.style.borderLeft = '6px solid #2196F3';
        questionElement.style.backgroundColor = '#f0f8ff';
    }
}

// Handle answer selection - PERSIST DATA
function selectAnswer(questionId, answerIndex) {
    currentQuizAnswers[questionId] = answerIndex;
    
    // Lưu vào localStorage để khôi phục sau này
    saveSelectionsToStorage();
    
    console.log(`Saved answer for question ${questionId}: ${answerIndex}`);
    console.log('All current answers:', currentQuizAnswers);
}

// Save selections to localStorage
function saveSelectionsToStorage() {
    try {
        localStorage.setItem('quizSelections', JSON.stringify(currentQuizAnswers));
    } catch (e) {
        console.warn('Could not save selections to localStorage:', e);
    }
}

// Restore selections from localStorage
function restoreSelections() {
    try {
        const savedSelections = localStorage.getItem('quizSelections');
        if (savedSelections) {
            currentQuizAnswers = JSON.parse(savedSelections);
            
            // Restore visual selections
            Object.keys(currentQuizAnswers).forEach(questionId => {
                const answerIndex = currentQuizAnswers[questionId];
                updateQuestionSelection(questionId, answerIndex);
                
                // Also check the radio button
                const questionElement = document.querySelector(`[data-question="${questionId}"]`);
                if (questionElement) {
                    const radioButton = questionElement.querySelector(`input[type="radio"][value="${answerIndex}"]`);
                    if (radioButton) {
                        radioButton.checked = true;
                    }
                }
            });
            
            console.log('Restored selections:', currentQuizAnswers);
        }
    } catch (e) {
        console.warn('Could not restore selections from localStorage:', e);
    }
}

// Toggle section visibility
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const toggleBtn = document.querySelector(`#${sectionId.replace('-content', '-toggle')}`);
    
    if (content && toggleBtn) {
        const isVisible = content.style.display !== 'none';
        
        if (isVisible) {
            content.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            toggleBtn.classList.add('collapsed');
        } else {
            content.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            toggleBtn.classList.remove('collapsed');
        }
    }
}

// Setup toggle buttons
function setupToggleButtons() {
    // Initialize all sections as visible
    const sections = ['toc-content', 'english-content', 'vietnamese-content'];
    sections.forEach(sectionId => {
        const content = document.getElementById(sectionId);
        if (content) {
            content.style.display = 'block';
        }
    });
}

// Audio controls setup
function setupAudioControls() {
    const audio = document.getElementById('lesson-audio');
    const speedSelect = document.getElementById('playback-speed');
    
    if (audio && speedSelect) {
        speedSelect.addEventListener('change', function() {
            audio.playbackRate = parseFloat(this.value);
        });

        // Add time display
        audio.addEventListener('loadedmetadata', function() {
            updateDuration();
        });

        audio.addEventListener('timeupdate', function() {
            updateCurrentTime();
        });
    }
}

function updateDuration() {
    const audio = document.getElementById('lesson-audio');
    const durationSpan = document.getElementById('audio-duration');
    
    if (audio && durationSpan && !isNaN(audio.duration)) {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        durationSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateCurrentTime() {
    const audio = document.getElementById('lesson-audio');
    
    if (audio) {
        const currentMinutes = Math.floor(audio.currentTime / 60);
        const currentSeconds = Math.floor(audio.currentTime % 60);
        const totalMinutes = Math.floor(audio.duration / 60);
        const totalSeconds = Math.floor(audio.duration % 60);
        
        // You can add a current time display here if needed
    }
}

// Submit quiz - PRESERVE SELECTIONS WITH CUSTOM STYLING
function submitQuiz() {
    if (quizSubmitted) return;
    
    const allQuestions = document.querySelectorAll('.quiz-question');
    const totalQuestions = allQuestions.length;
    const answeredQuestions = Object.keys(currentQuizAnswers).length;
    
    console.log(`Submitting quiz: ${answeredQuestions}/${totalQuestions} questions answered`);
    console.log('Answers:', currentQuizAnswers);
    
    if (answeredQuestions < totalQuestions) {
        if (!confirm(`Bạn chỉ trả lời ${answeredQuestions}/${totalQuestions} câu. Bạn có muốn nộp bài không?`)) {
            return;
        }
    }
    
    let correctAnswers = 0;
    
    allQuestions.forEach((questionElement) => {
        const questionId = questionElement.getAttribute('data-question');
        const correctAnswer = parseInt(questionElement.getAttribute('data-correct'));
        const userAnswer = currentQuizAnswers[questionId];
        const isCorrect = userAnswer === correctAnswer;
        
        if (isCorrect) correctAnswers++;
        
        // Add submitted class to question
        questionElement.classList.add('submitted');
        questionElement.style.borderColor = '#cccccc';
        
        // Show correct/incorrect visual feedback
        const options = questionElement.querySelectorAll('.option-label');
        
        options.forEach((option, optionIndex) => {
            const input = option.querySelector('input');
            
            // Remove existing checkmarks
            const existingCheckmark = option.querySelector('.custom-checkmark');
            if (existingCheckmark) {
                existingCheckmark.remove();
            }
            
            // Highlight correct answer (green)
            if (optionIndex === correctAnswer) {
                option.style.border = '2px solid #4CAF50';
                option.style.backgroundColor = '#E8F5E8';
                
                // Add correct checkmark
                const correctMark = document.createElement('span');
                correctMark.className = 'custom-checkmark';
                correctMark.innerHTML = '✓';
                correctMark.style.position = 'absolute';
                correctMark.style.right = '15px';
                correctMark.style.top = '50%';
                correctMark.style.transform = 'translateY(-50%)';
                correctMark.style.color = '#4CAF50';
                correctMark.style.fontWeight = 'bold';
                correctMark.style.fontSize = '16px';
                
                option.appendChild(correctMark);
            }
            
            // Highlight incorrect user answer (red)
            if (optionIndex === userAnswer && !isCorrect) {
                option.style.border = '2px solid #f44336';
                option.style.backgroundColor = '#FFEBEE';
                
                // Add incorrect mark
                const incorrectMark = document.createElement('span');
                incorrectMark.className = 'custom-checkmark';
                incorrectMark.innerHTML = '✗';
                incorrectMark.style.position = 'absolute';
                incorrectMark.style.right = '15px';
                incorrectMark.style.top = '50%';
                incorrectMark.style.transform = 'translateY(-50%)';
                incorrectMark.style.color = '#f44336';
                incorrectMark.style.fontWeight = 'bold';
                incorrectMark.style.fontSize = '16px';
                
                option.appendChild(incorrectMark);
            }
            
            // Keep the selected style for user's correct answer
            if (optionIndex === userAnswer && isCorrect) {
                option.style.border = '2px solid #4CAF50';
                option.style.backgroundColor = '#E8F5E8';
                
                // Add correct checkmark
                const correctMark = document.createElement('span');
                correctMark.className = 'custom-checkmark';
                correctMark.innerHTML = '✓';
                correctMark.style.position = 'absolute';
                correctMark.style.right = '15px';
                correctMark.style.top = '50%';
                correctMark.style.transform = 'translateY(-50%)';
                correctMark.style.color = '#4CAF50';
                correctMark.style.fontWeight = 'bold';
                correctMark.style.fontSize = '16px';
                
                option.appendChild(correctMark);
            }
            
            // Disable all inputs after submission
            input.disabled = true;
            input.style.cursor = 'not-allowed';
        });
        
        console.log(`Question ${questionId}: correct=${correctAnswer}, user=${userAnswer}, isCorrect=${isCorrect}`);
    });
    
    // Show results
    displayResults(correctAnswers, totalQuestions);
    quizSubmitted = true;
    
    // Clear saved selections after submission
    clearSavedSelections();
    
    // Disable submit button
    const submitBtn = document.getElementById('submit-quiz');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Đã nộp bài';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.style.opacity = '0.6';
    }
}

// Display quiz results
function displayResults(score, total) {
    const resultDiv = document.getElementById('quiz-result');
    const scoreElement = document.getElementById('final-score');
    const feedbackElement = document.getElementById('result-feedback');
    
    if (resultDiv && scoreElement && feedbackElement) {
        scoreElement.textContent = score;
        
        // Calculate percentage
        const percentage = (score / total) * 100;
        
        // Provide feedback based on score
        let feedback = '';
        let feedbackClass = '';
        
        if (percentage >= 90) {
            feedback = 'Xuất sắc! Bạn đã hiểu rất rõ nội dung bài học.';
            feedbackClass = 'excellent';
        } else if (percentage >= 70) {
            feedback = 'Tốt! Bạn đã nắm được phần lớn nội dung. Hãy nghe lại một vài phần để hiểu rõ hơn.';
            feedbackClass = 'good';
        } else if (percentage >= 50) {
            feedback = 'Khá! Bạn cần luyện tập thêm. Hãy nghe lại bài và đọc kỹ đoạn văn.';
            feedbackClass = 'fair';
        } else {
            feedback = 'Cần cố gắng hơn! Hãy nghe lại bài nhiều lần và học từ vựng thêm.';
            feedbackClass = 'poor';
        }
        
        feedbackElement.innerHTML = `<p class="${feedbackClass}">${feedback}</p>`;
        resultDiv.style.display = 'block';
        
        // Scroll to results
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    console.log(`Quiz results: ${score}/${total} (${percentage.toFixed(1)}%)`);
}

// Reset quiz - CLEAR ALL SELECTIONS AND CUSTOM STYLING
function resetQuiz() {
    if (!confirm('Bạn có chắc muốn làm lại bài tập? Tất cả đáp án sẽ bị xóa.')) {
        return;
    }
    
    currentQuizAnswers = {};
    quizSubmitted = false;
    
    // Clear saved selections
    clearSavedSelections();
    
    // Reset visual feedback and custom styling
    const questionElements = document.querySelectorAll('.quiz-question');
    questionElements.forEach(element => {
        element.classList.remove('answered', 'submitted');
        element.style.borderLeft = '';
        element.style.backgroundColor = '';
        element.style.borderColor = '';
        
        const options = element.querySelectorAll('.option-label');
        options.forEach(option => {
            // Remove custom classes
            option.classList.remove('correct', 'incorrect', 'selected');
            
            // Reset custom styles
            option.style.border = '';
            option.style.backgroundColor = '';
            option.style.position = '';
            
            // Remove custom checkmarks
            const existingCheckmark = option.querySelector('.custom-checkmark');
            if (existingCheckmark) {
                existingCheckmark.remove();
            }
            
            // Reset radio buttons
            const input = option.querySelector('input');
            input.checked = false;
            input.disabled = false;
            input.style.borderColor = '';
            input.style.cursor = '';
        });
    });
    
    // Hide results
    const resultDiv = document.getElementById('quiz-result');
    if (resultDiv) {
        resultDiv.style.display = 'none';
    }
    
    // Reset submit button
    const submitBtn = document.getElementById('submit-quiz');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Nộp bài';
        submitBtn.style.cursor = '';
        submitBtn.style.opacity = '';
    }
    
    console.log('Quiz reset successfully');
    console.log('Current answers:', currentQuizAnswers);
}

// Clear saved selections from storage
function clearSavedSelections() {
    try {
        localStorage.removeItem('quizSelections');
    } catch (e) {
        console.warn('Could not clear selections from localStorage:', e);
    }
}

// Utility function to format time
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Export functions for global access
window.toggleSection = toggleSection;
window.selectAnswer = selectAnswer;
window.submitQuiz = submitQuiz;
window.resetQuiz = resetQuiz;
