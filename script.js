document.addEventListener('DOMContentLoaded', () => {

    // --- State Management & Backend URL ---
    let currentQuestion = '';
    let currentAnswer = '';
    let selectedTeacherGender = 'female';
    const BACKEND_URL = 'https://smart-study-ai.onrender.com';

    // --- Sound Effect Setup ---
    const clickSound = document.getElementById('click-sound');
    const relaxSound = document.getElementById('relax-sound');

    // --- Element Selection ---
    const getElement = (id) => document.getElementById(id);
    
    const landingContainer = getElement('landing-container');
    const teacherSelectContainer = getElement('teacher-select-container');
    const preparationContainer = getElement('preparation-container');
    const qaContainer = getElement('qa-container');
    const challengeContainer = getElement('challenge-container');
    const loadingSpinner = getElement('loading-spinner');

    const getStartedBtn = getElement('getStartedBtn');
    const avatarButtons = document.querySelectorAll('.avatar-button');
    const doneBtn = getElement('doneBtn');
    const breathingImage = getElement('breathingImage');
    
    const questionInput = getElement('questionInput');
    const answerInput = getElement('answerInput');
    const generateBtn = getElement('generateBtn');
    
    const ttsResultContainer = getElement('ttsResultContainer');
    const audioPlayer = getElement('audioPlayer');
    const challengeBtn = getElement('challengeBtn');

    const displayQuestion = getElement('displayQuestion');
    const userAnswerInput = getElement('userAnswerInput');
    const checkAnswerBtn = getElement('checkAnswerBtn');
    
    const challengeResultContainer = getElement('challengeResultContainer');
    const resultMessage = getElement('resultMessage');
    const nextQuestionBtn = getElement('nextQuestionBtn');
    const tryAgainBtn = getElement('tryAgainBtn');

    // --- Initial Setup & Event Listeners ---
    if (breathingImage) {
        breathingImage.src = `relaxing.png?t=${new Date().getTime()}`;
    }

    const addClickSound = (element) => {
        if (element) element.addEventListener('click', playClickSound);
    };

    [getStartedBtn, doneBtn, generateBtn, challengeBtn, checkAnswerBtn, nextQuestionBtn, tryAgainBtn].forEach(addClickSound);
    // Also add sound to teacher avatars
    avatarButtons.forEach(button => addClickSound(button));

    function playClickSound() {
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.log("Sound play failed:", e));
        }
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            transitionTo(teacherSelectContainer, landingContainer)
        });
    }
    
    avatarButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedTeacherGender = button.dataset.teacher.toLowerCase();
            setTimeout(() => {
                if(relaxSound) {
                    relaxSound.currentTime = 0;
                    relaxSound.play().catch(e => console.log("Sound play failed:", e));
                }
            }, 2000);
            transitionTo(preparationContainer, teacherSelectContainer);
            setTimeout(() => {
                if(doneBtn) {
                    doneBtn.style.display = 'inline-block';
                    doneBtn.classList.add('fade-in');
                }
            }, 8000);
        });
    });
    
    if (doneBtn) {
        doneBtn.addEventListener('click', () => transitionTo(qaContainer, preparationContainer));
    }
    
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const questionText = questionInput.value.trim();
            const answerText = answerInput.value.trim();

            if (!questionText || !answerText) {
                alert('Please enter both a question and an answer.');
                return;
            }
            
            showLoadingSpinner(true);

            try {
                const response = await fetch(`${BACKEND_URL}/generate-tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        question: questionText,
                        answer: answerText,
                        gender: selectedTeacherGender 
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to generate audio.');
                }

                const data = await response.json();
                audioPlayer.src = data.audio_url;
                
                currentQuestion = questionText;
                currentAnswer = answerText;

                ttsResultContainer.classList.remove('hidden');

            } catch (error) {
                console.error('Error:', error);
                alert(`Sorry, there was an error: ${error.message}`);
            } finally {
                showLoadingSpinner(false);
            }
        });
    }
    
    if (challengeBtn) {
        challengeBtn.addEventListener('click', () => {
            displayQuestion.textContent = currentQuestion;
            userAnswerInput.value = '';
            challengeResultContainer.classList.add('hidden');
            nextQuestionBtn.classList.add('hidden');
            tryAgainBtn.classList.add('hidden');
            transitionTo(challengeContainer, qaContainer);
        });
    }

    if (checkAnswerBtn) {
        checkAnswerBtn.addEventListener('click', () => {
            const userAnswer = userAnswerInput.value.trim().toLowerCase();
            const correctAnswer = currentAnswer.trim().toLowerCase();

            challengeResultContainer.classList.remove('hidden');

            if (userAnswer === correctAnswer) {
                resultMessage.textContent = "You're a genius! Perfect recall! 🎉";
                resultMessage.className = 'success';
                nextQuestionBtn.classList.remove('hidden');
                tryAgainBtn.classList.add('hidden');
            } else {
                resultMessage.textContent = "Good try, you're almost there! Let's go again. 💪";
                resultMessage.className = 'error';
                tryAgainBtn.classList.remove('hidden');
                nextQuestionBtn.classList.add('hidden');
            }
        });
    }

    if(tryAgainBtn) tryAgainBtn.addEventListener('click', () => {
        userAnswerInput.value = '';
        userAnswerInput.focus();
        challengeResultContainer.classList.add('hidden');
    });

    if(nextQuestionBtn) nextQuestionBtn.addEventListener('click', () => {
        questionInput.value = '';
        answerInput.value = '';
        ttsResultContainer.classList.add('hidden');
        transitionTo(qaContainer, challengeContainer);
    });
    
    function showLoadingSpinner(show) {
        if(loadingSpinner) loadingSpinner.classList.toggle('hidden', !show);
    }
    
    // ▼▼▼ THIS IS THE FIX ▼▼▼
    // I simplified this function to be more reliable and removed the complex logic that was causing the crash.
    function transitionTo(nextScreen, currentScreen) {
        if (currentScreen) {
            currentScreen.classList.add('fade-out');
            setTimeout(() => {
                currentScreen.style.display = 'none';
            }, 500);
        }
        if (nextScreen) {
            setTimeout(() => {
                // All our screens use 'flex' for centering, so this is safer.
                nextScreen.style.display = 'flex'; 
                setTimeout(() => {
                    nextScreen.classList.remove('fade-out');
                }, 20);
            }, currentScreen ? 500 : 0);
        }
    }
    // ▲▲▲ END OF THE FIX ▲▲▲
});
