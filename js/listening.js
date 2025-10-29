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
}

// Setup quiz interactions
function setupQuizInteractions() {
    const radioButtons = document.querySelectorAll('.quiz-question input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            const questionIndex = this.name.split('_')[1];
            const answerIndex = parseInt(this.value);
            selectAnswer(questionIndex, answerIndex);
        });
    });
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

// Handle answer selection
function selectAnswer(questionIndex, answerIndex) {
    currentQuizAnswers[questionIndex] = answerIndex;
    
    // Visual feedback
    const questionElement = document.querySelector(`[data-question="${questionIndex}"]`);
    if (questionElement) {
        questionElement.classList.add('answered');
        
        // Remove previous selection styling
        const options = questionElement.querySelectorAll('.option-label');
        options.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection styling to current option
        const selectedOption = questionElement.querySelector(`[data-option="${answerIndex}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }
}

// Submit quiz
function submitQuiz() {
    if (quizSubmitted) return;
    
    const allQuestions = document.querySelectorAll('.quiz-question');
    const totalQuestions = allQuestions.length;
    const answeredQuestions = Object.keys(currentQuizAnswers).length;
    
    if (answeredQuestions < totalQuestions) {
        if (!confirm(`Bạn chỉ trả lời ${answeredQuestions}/${totalQuestions} câu. Bạn có muốn nộp bài không?`)) {
            return;
        }
    }
    
    let correctAnswers = 0;
    
    allQuestions.forEach((questionElement, index) => {
        const correctAnswer = parseInt(questionElement.getAttribute('data-correct'));
        const userAnswer = currentQuizAnswers[index];
        const isCorrect = userAnswer === correctAnswer;
        
        if (isCorrect) correctAnswers++;
        
        // Add submitted class to question
        questionElement.classList.add('submitted');
        
        // Show correct/incorrect visual feedback
        const options = questionElement.querySelectorAll('.option-label');
        
        options.forEach((option, optionIndex) => {
            const input = option.querySelector('input');
            
            if (optionIndex === correctAnswer) {
                option.classList.add('correct');
            } else if (optionIndex === userAnswer && !isCorrect) {
                option.classList.add('incorrect');
            }
            
            input.disabled = true;
        });
    });
    
    // Show results
    displayResults(correctAnswers, totalQuestions);
    quizSubmitted = true;
    
    // Disable submit button
    const submitBtn = document.getElementById('submit-quiz');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Đã nộp bài';
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
}

// Reset quiz
function resetQuiz() {
    if (!confirm('Bạn có chắc muốn làm lại bài tập? Tất cả đáp án sẽ bị xóa.')) {
        return;
    }
    
    currentQuizAnswers = {};
    quizSubmitted = false;
    
    // Reset visual feedback
    const questionElements = document.querySelectorAll('.quiz-question');
    questionElements.forEach(element => {
        element.classList.remove('answered', 'submitted');
        
        const options = element.querySelectorAll('.option-label');
        options.forEach(option => {
            option.classList.remove('correct', 'incorrect', 'selected');
            const input = option.querySelector('input');
            input.checked = false;
            input.disabled = false;
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
