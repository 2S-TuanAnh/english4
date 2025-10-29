// Speaking.js - JavaScript for Speaking Page with Web Speech API

// Web Speech API variables
const speechSynthesis = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Global variables
let recognition = null;
let isRecording = false;
let currentRecordingIndex = null;
let recognitionActive = false; // Track recognition engine state

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSpeakingPage();
});

function initializeSpeakingPage() {
    setupToggleButtons();
    initializeSpeechAPI();
    setupSentenceButtons();
    console.log('Speaking page initialized');
    console.log('Speech synthesis supported:', 'speechSynthesis' in window);
    console.log('Speech recognition supported:', !!SpeechRecognition);
}

// Initialize Speech Recognition API
function initializeSpeechAPI() {
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        // Request microphone permission on initialization
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('Microphone permission granted');
                stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking permission
            })
            .catch(error => {
                console.error('Microphone permission denied:', error);
                showNotification('Vui lòng cho phép truy cập microphone để sử dụng tính năng ghi âm', 'warning');
            });
        
        recognition.onstart = () => {
            console.log('🎤 Recording started for sentence:', currentRecordingIndex);
            isRecording = true;
            recognitionActive = true;
        };
        
        recognition.onresult = (event) => {
            console.log('🎯 Speech Recognition Result Received!');
            
            if (event.results.length === 0) {
                console.log('No speech results received');
                showNotification('Không nhận dạng được giọng nói. Vui lòng thử lại.', 'warning');
                return;
            }
            
            const result = event.results[0];
            if (!result || result.length === 0) {
                console.log('Empty speech result');
                showNotification('Không nhận dạng được giọng nói. Vui lòng thử lại.', 'warning');
                return;
            }
            
            const transcript = result[0].transcript.trim();
            const speechConfidence = result[0].confidence;
            
            console.log(`👂 What user said: "${transcript}"`);
            console.log(`🎯 Confidence: ${Math.round(speechConfidence * 100)}%`);
            
            if (!transcript) {
                showNotification('Không nhận dạng được giọng nói. Vui lòng nói to và rõ hơn.', 'warning');
                return;
            }
            
            // Get target text from HTML .sentence-text element  
            const sentenceTextElement = document.querySelector(`[data-sentence="${currentRecordingIndex}"] .sentence-text`);
            let targetText = '';
            
            if (sentenceTextElement) {
                targetText = sentenceTextElement.textContent.trim();
            } else {
                // Fallback - find by index in all sentence-text elements
                const allSentenceTexts = document.querySelectorAll('.sentence-text');
                if (allSentenceTexts[currentRecordingIndex]) {
                    targetText = allSentenceTexts[currentRecordingIndex].textContent.trim();
                }
            }
            
            console.log(`📝 Target text from HTML: "${targetText}"`);
            
            if (!targetText) {
                console.error(`❌ No target text found for sentence ${currentRecordingIndex}`);
                showNotification('Lỗi: Không tìm thấy văn bản để so sánh', 'error');
                return;
            }
            
            // Compare speech with HTML text and calculate score
            console.log(`🔍 Comparing speech with HTML text...`);
            const score = calculatePronunciationScore(transcript, targetText);
            console.log(`📊 Calculated score: ${score}/100`);
            
            // Update score in .score-value element
            updateScore(currentRecordingIndex, score);
            updateProgress(currentRecordingIndex, score);
            console.log(`✅ Score displayed in .score-value: ${score}/100`);
            
            // Show detailed feedback
            const confidencePercentage = Math.round(speechConfidence * 100);
            console.log('🎉 Speech recognition process complete!');
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            recognitionActive = false;
            
            // Don't immediately stop effects for certain errors
            if (event.error === 'aborted') {
                console.log('🔄 Recognition aborted - this is expected when switching');
                return; // Don't show error message or stop effects
            }
            
            // Find elements for current recording
            let button = document.querySelector(`[data-sentence="${currentRecordingIndex}"] .record-sentence-btn`);
            if (!button) {
                const buttons = document.querySelectorAll('.record-sentence-btn');
                button = buttons[currentRecordingIndex];
            }
            
            let pronunciationBar = document.querySelector(`[data-sentence="${currentRecordingIndex}"]`);
            
            // Remove visual effects and show error
            stopRecordingEffects(button, pronunciationBar);
            
            // More detailed error handling
            switch(event.error) {
                case 'not-allowed':
                    showNotification('❌ Quyền truy cập microphone bị từ chối. Vui lòng cho phép và làm mới trang.', 'error');
                    break;
                case 'audio-capture':
                    showNotification('❌ Không tìm thấy microphone. Vui lòng kiểm tra thiết bị âm thanh.', 'error');
                    break;
                case 'network':
                    showNotification('❌ Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.', 'error');
                    break;
                case 'no-speech':
                    showNotification('🔇 Không phát hiện giọng nói. Vui lòng nói to và rõ hơn.', 'warning');
                    break;
                case 'service-not-allowed':
                    showNotification('❌ Dịch vụ nhận dạng giọng nói bị từ chối. Vui lòng thử lại.', 'error');
                    break;
                default:
                    showNotification(`❌ Lỗi nhận dạng giọng nói: ${event.error}. Vui lòng thử lại.`, 'error');
            }
        };
        
        recognition.onend = () => {
            console.log('🔚 Speech recognition ended');
            recognitionActive = false;
            
            // Don't reset currentRecordingIndex here - let it be handled by stopRecordingEffects
            console.log('🔚 Recognition ended for sentence:', currentRecordingIndex);
        };
    } else {
        console.error('Speech Recognition API not supported');
        showNotification('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.', 'error');
    }
}

// Setup sentence buttons
function setupSentenceButtons() {
    // Add event listeners to all play and record buttons
    document.querySelectorAll('.play-sentence-btn').forEach((button, index) => {
        button.addEventListener('click', () => playSentence(index));
    });
    
    document.querySelectorAll('.record-sentence-btn').forEach((button, index) => {
        button.addEventListener('click', () => recordSentence(index));
    });
}

// Play sentence using audio file
function playSentence(index) {
    // Stop any currently playing audio
    const existingAudio = document.querySelector('.playing-audio');
    if (existingAudio) {
        existingAudio.pause();
        existingAudio.remove();
    }
    
    // Create new audio element
    const audio = new Audio('audio_speaking/uk3_accent.wav');
    audio.className = 'playing-audio';
    
    let button = document.querySelector(`[data-sentence="${index}"] .play-sentence-btn`);
    if (!button) {
        // Fallback for onclick buttons
        const buttons = document.querySelectorAll('.play-sentence-btn');
        button = buttons[index];
    }
    
    if (button) {
        button.classList.add('playing');
        button.innerHTML = '<i class="fas fa-pause"></i>';
    }
    
    audio.play().then(() => {
        console.log('Playing audio for sentence:', index);
    }).catch(error => {
        console.error('Error playing audio:', error);
        if (button) {
            button.classList.remove('playing');
            button.innerHTML = '<i class="fas fa-play"></i>';
        }
        showNotification('Lỗi phát audio', 'error');
    });
    
    // Reset button when audio ends
    audio.onended = () => {
        if (button) {
            button.classList.remove('playing');
            button.innerHTML = '<i class="fas fa-play"></i>';
        }
        audio.remove();
    };
    
    // Handle audio errors
    audio.onerror = () => {
        if (button) {
            button.classList.remove('playing');
            button.innerHTML = '<i class="fas fa-play"></i>';
        }
        audio.remove();
        showNotification('Không thể tải file audio', 'error');
    };
}

// Record sentence using Speech Recognition with toggle functionality
function recordSentence(index) {
    console.log(`🎤 recordSentence(${index}) called`);
    
    if (!recognition) {
        showNotification('❌ Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.', 'error');
        return;
    }
    
    // Check microphone permission first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('❌ Thiết bị của bạn không hỗ trợ ghi âm. Vui lòng sử dụng thiết bị khác.', 'error');
        return;
    }
    
    let button = document.querySelector(`[data-sentence="${index}"] .record-sentence-btn`);
    if (!button) {
        // Fallback for onclick buttons
        const buttons = document.querySelectorAll('.record-sentence-btn');
        button = buttons[index];
    }
    
    let pronunciationBar = document.querySelector(`[data-sentence="${index}"]`);
    
    // Toggle recording state
    if (isRecording && currentRecordingIndex === index) {
        // Stop current recording
        console.log('🛑 Stopping recording');
        try {
            if (recognitionActive) {
                recognition.stop();
            }
        } catch (error) {
            console.log('Recognition already stopped or not started');
        }
        stopRecordingEffects(button, pronunciationBar);
        return;
    } else if (isRecording) {
        // Stop current recording and start new one
        console.log('🔄 Switching to new recording');
        
        // Store previous recording info before stopping
        const prevButton = document.querySelector(`[data-sentence="${currentRecordingIndex}"] .record-sentence-btn`);
        const prevBar = document.querySelector(`[data-sentence="${currentRecordingIndex}"]`);
        
        try {
            if (recognitionActive) {
                recognition.abort(); // Use abort for immediate stop
            }
        } catch (error) {
            console.log('Recognition already stopped');
        }
        
        // Clean up previous recording
        if (prevButton) {
            prevButton.classList.remove('recording');
            prevButton.innerHTML = '<i class="fas fa-microphone"></i>';
        }
        if (prevBar) {
            prevBar.classList.remove('active', 'recording');
        }
        
        // Wait for abort to complete, then start new recording
        setTimeout(() => {
            startNewRecording(index, button, pronunciationBar);
        }, 200);
        return;
    }
    
    // Start new recording
    startNewRecording(index, button, pronunciationBar);
}

// Start new recording with visual effects
function startNewRecording(index, button, pronunciationBar) {
    console.log(`🚀 Starting recording for sentence ${index}`);
    
    // Read text directly from HTML .sentence-text element
    const sentenceTextElement = document.querySelector(`[data-sentence="${index}"] .sentence-text`);
    let targetText = '';
    
    if (sentenceTextElement) {
        targetText = sentenceTextElement.textContent.trim();
    } else {
        // Fallback - find by index in all sentence-text elements
        const allSentenceTexts = document.querySelectorAll('.sentence-text');
        if (allSentenceTexts[index]) {
            targetText = allSentenceTexts[index].textContent.trim();
        }
    }
    
    console.log(`📖 Text from HTML (.sentence-text): "${targetText}"`);
    
    if (!targetText) {
        showNotification('❌ Không tìm thấy văn bản để so sánh', 'error');
        return;
    }
    
    // Check microphone permission before starting
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Permission granted, stop the stream and start recording
            stream.getTracks().forEach(track => track.stop());
            
            // Set recording state
            currentRecordingIndex = index;
            isRecording = true;
            
            // Add visual effects - microphone activated with red pulse border
            if (button) {
                button.classList.add('recording');
                button.innerHTML = '<i class="fas fa-stop"></i>';
            }
            
            if (pronunciationBar) {
                pronunciationBar.classList.add('active', 'recording');
            }
            
            // Start Speech Recognition API
            console.log('🎧 Activating Speech Recognition API...');
            console.log('🎯 Current recording index:', index);
            
            // Make sure recognition is not already running
            if (recognitionActive) {
                console.log('⏸️ Recognition is already active, aborting previous session');
                try {
                    recognition.abort();
                    recognitionActive = false;
                } catch (error) {
                    console.log('Could not abort previous session');
                }
                // Wait for abort to complete
                setTimeout(() => {
                    startRecognitionSession();
                }, 300);
            } else {
                startRecognitionSession();
            }
            
            function startRecognitionSession() {
                if (recognitionActive) {
                    console.log('🚫 Recognition still active after waiting, giving up');
                    showNotification('🔄 Hệ thống đang bận. Vui lòng thử lại sau 2 giây', 'warning');
                    stopRecordingEffects(button, pronunciationBar);
                    return;
                }
                
                try {
                    console.log('🚀 Starting fresh recognition session');
                    recognition.start();
                    console.log('✅ Speech Recognition started successfully');
                } catch (error) {
                    console.error('Error starting recognition:', error);
                    stopRecordingEffects(button, pronunciationBar);
                    if (error.name === 'InvalidStateError') {
                    } else {
                        showNotification('❌ Lỗi khởi động ghi âm. Vui lòng thử lại.', 'error');
                    }
                }
            }
        })
        .catch(error => {
            console.error('Microphone permission error:', error);
            showNotification('❌ Không thể truy cập microphone. Vui lòng cho phép quyền truy cập và thử lại.', 'error');
        });
}

// Stop recording and remove visual effects
function stopRecordingEffects(button, pronunciationBar) {
    const prevIndex = currentRecordingIndex; // Store for logging
    
    isRecording = false;
    recognitionActive = false;
    currentRecordingIndex = null;
    
    // Remove visual effects - microphone deactivated
    if (button) {
        button.classList.remove('recording');
        button.innerHTML = '<i class="fas fa-microphone"></i>';
    }
    
    if (pronunciationBar) {
        pronunciationBar.classList.remove('active', 'recording');
    }
    
    console.log(`🔇 Recording stopped for sentence ${prevIndex}, visual effects removed`);
}

// Calculate pronunciation score with improved algorithm
function calculatePronunciationScore(recognized, target) {
    // Clean and normalize text
    const recognizedClean = recognized.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const targetClean = target.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    if (!recognizedClean || !targetClean) {
        console.log('❌ Empty input for scoring');
        return 0;
    }
    
    const recognizedWords = recognizedClean.split(/\s+/).filter(word => word.length > 0);
    const targetWords = targetClean.split(/\s+/).filter(word => word.length > 0);
    
    console.log(`🔍 Comparing: "${recognizedWords.join(' ')}" vs "${targetWords.join(' ')}"`);
    
    if (targetWords.length === 0) return 0;
    
    let totalScore = 0;
    let perfectMatches = 0;
    let partialMatches = 0;
    
    // Check each target word against recognized words
    targetWords.forEach((targetWord, index) => {
        let bestScore = 0;
        let hasMatch = false;
        
        recognizedWords.forEach(recWord => {
            let wordScore = 0;
            
            // Exact match - highest score
            if (recWord === targetWord) {
                wordScore = 100;
                perfectMatches++;
                hasMatch = true;
            }
            // Very close match (1 character difference)
            else if (levenshteinDistance(recWord, targetWord) === 1 && targetWord.length > 3) {
                wordScore = 85;
                partialMatches++;
                hasMatch = true;
            }
            // Partial matches
            else if (recWord.includes(targetWord) || targetWord.includes(recWord)) {
                if (Math.abs(recWord.length - targetWord.length) <= 2) {
                    wordScore = 75;
                    partialMatches++;
                    hasMatch = true;
                }
            }
            // Fuzzy match with Levenshtein distance
            else {
                const distance = levenshteinDistance(recWord, targetWord);
                const maxAllowedDistance = Math.max(1, Math.floor(targetWord.length * 0.4));
                
                if (distance <= maxAllowedDistance) {
                    // Score decreases with distance
                    wordScore = Math.max(40, 80 - (distance * 20));
                    if (wordScore >= 40) {
                        partialMatches++;
                        hasMatch = true;
                    }
                }
            }
            
            bestScore = Math.max(bestScore, wordScore);
        });
        
        totalScore += bestScore;
        
        if (!hasMatch) {
            console.log(`❌ No match found for word: "${targetWord}"`);
        }
    });
    
    // Calculate base accuracy
    let accuracy = Math.round(totalScore / targetWords.length);
    
    // Bonus scoring system
    const matchRatio = (perfectMatches + partialMatches) / targetWords.length;
    const perfectRatio = perfectMatches / targetWords.length;
    
    // Bonus for high perfect match ratio
    if (perfectRatio >= 0.8) {
        accuracy += 10;
    } else if (perfectRatio >= 0.6) {
        accuracy += 5;
    }
    
    // Bonus for sentence length matching
    if (Math.abs(recognizedWords.length - targetWords.length) <= 1) {
        accuracy += 3;
    }
    
    // Penalty for very poor recognition
    if (matchRatio < 0.3) {
        accuracy = Math.max(accuracy - 15, 10);
    }
    
    // Ensure minimum score for attempting
    if (recognizedWords.length > 0 && accuracy < 5) {
        accuracy = 10;
    }
    
    const finalScore = Math.max(0, Math.min(accuracy, 100));
    
    console.log(`📊 Scoring details:`);
    console.log(`   - Perfect matches: ${perfectMatches}/${targetWords.length}`);
    console.log(`   - Partial matches: ${partialMatches}/${targetWords.length}`);
    console.log(`   - Match ratio: ${Math.round(matchRatio * 100)}%`);
    console.log(`   - Final score: ${finalScore}/100`);
    
    return finalScore;
}

// Levenshtein distance for fuzzy word matching
function levenshteinDistance(str1, str2) {
    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;
    
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// Update score display
function updateScore(index, score) {
    const scoreElement = document.getElementById(`score-${index}`);
    if (!scoreElement) {
        console.error(`Score element #score-${index} not found`);
        return;
    }
    
    const scoreValue = scoreElement.querySelector('.score-value');
    if (!scoreValue) {
        console.error(`Score value element not found in #score-${index}`);
        return;
    }
    
    scoreValue.textContent = score;
    
    // Update score class based on performance
    scoreElement.className = 'sentence-score';
    if (score >= 90) {
        scoreElement.classList.add('excellent');
    } else if (score >= 75) {
        scoreElement.classList.add('good');
    } else if (score >= 60) {
        scoreElement.classList.add('fair');
    } else {
        scoreElement.classList.add('poor');
    }
    
    console.log(`✅ Updated score for sentence ${index}: ${score}/100`);
}

// Update progress bar
function updateProgress(index, score) {
    const progressBar = document.getElementById(`progress-${index}`);
    const pronunciationBar = document.querySelector(`[data-sentence="${index}"]`);
    
    if (progressBar) {
        progressBar.style.width = `${score}%`;
        console.log(`📊 Updated progress bar for sentence ${index}: ${score}%`);
    }
    
    if (pronunciationBar && score >= 75) {
        pronunciationBar.classList.add('completed');
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
    const sections = ['toc-content'];
    sections.forEach(sectionId => {
        const content = document.getElementById(sectionId);
        if (content) {
            content.style.display = 'block';
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
        
        // Add notification styles if not already in CSS
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px 20px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    max-width: 350px;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                    font-family: 'Poppins', sans-serif;
                }
                .notification.info {
                    border-color: #3b82f6;
                    background: linear-gradient(135deg, #eff6ff, #f0f9ff);
                }
                .notification.error {
                    border-color: #ef4444;
                    background: linear-gradient(135deg, #fee2e2, #fecaca);
                    color: #991b1b;
                }
                .notification.success {
                    border-color: #10b981;
                    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
                    color: #065f46;
                }
                .notification.warning {
                    border-color: #f59e0b;
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    color: #92400e;
                }
                .notification i {
                    font-size: 1.2rem;
                }
                .notification.info i { color: #3b82f6; }
                .notification.error i { color: #ef4444; }
                .notification.success i { color: #10b981; }
                .notification.warning i { color: #f59e0b; }
                .notification span {
                    flex: 1;
                    font-weight: 500;
                    line-height: 1.4;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 
                        type === 'success' ? 'fa-check-circle' : 
                        type === 'warning' ? 'fa-exclamation-triangle' : 
                        'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Show notification
    notification.style.display = 'flex';
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 4000);
}

// Load voices when available
speechSynthesis.onvoiceschanged = () => {
    console.log('Voices loaded:', speechSynthesis.getVoices().length);
};

// Export functions for global access
window.toggleSection = toggleSection;
window.playSentence = playSentence;
window.recordSentence = recordSentence;

// Add error handling for page unload
window.addEventListener('beforeunload', () => {
    if (isRecording && recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.log('Error stopping recognition on page unload');
        }
    }
    recognitionActive = false;
});