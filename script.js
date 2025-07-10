document.addEventListener('DOMContentLoaded', () => {

    // --- State Management & Backend URL ---
    let currentQuestion = '';
    let currentAnswer = '';
    
    // ▼▼▼ THIS IS THE ONLY LINE WE CHANGED ▼▼▼
    // The new, live address of your backend server on Render!
    const BACKEND_URL = 'https://smart-study-ai.onrender.com'; 
    // ▲▲▲ THIS IS THE ONLY LINE WE CHANGED ▲▲▲

    // --- Sound Effect Setup ---
    const clickSound = document.getElementById('click-sound');
    const relaxSound = document.getElementById('relax-sound');

    // --- Element Selection (all screens) ---
    const getStartedBtn = document.getElementById('getStartedBtn');
    const landingContainer = document.getElementById('landing-container');
    const teacherSelectContainer = document.getElementById('teacher-select-container');
    const preparationContainer = document.getElementById('preparation-container');
    const avatarButtons = document.querySelectorAll('.avatar-button');
    const doneBtn = document.getElementById('doneBtn');
    const breathingImage = document.getElementById('breathingImage');
    const qaContainer = document.getElementById('qa-container');
    const questionInput = document.getElementById('questionInput');
    const answerInput = document.getElementById('answerInput');
    const generateBtn = document.getElementById('generateBtn');
    const ttsResultContainer = document.getElementById('ttsResultContainer');
    const audioPlayer = document.getElementById('audioPlayer');
    const challengeBtn = document.getElementById('challengeBtn');
    const challengeContainer = document.getElementById('challenge-container');
    const displayQuestion = document.getElementById('displayQuestion');
    const userAnswerInput = document.getElementById('userAnswerInput');
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    const challengeResultContainer = document.getElementById('challengeResultContainer');
    const resultMessage = document.getElementById('resultMessage');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    // --- Initial Setup ---
    if (breathingImage) {
        breathingImage.src = `relaxing.png?t=${new Date().getTime()}`;
    }

    // --- Sound Logic ---
    getStartedBtn.addEventListener('click', () => playClickSound());
    doneBtn.addEventListener('click', () => playClickSound());
    generateBtn.addEventListener('click', () => playClickSound());
    challengeBtn.addEventListener('click', () => playClickSound());
    checkAnswerBtn.addEventListener('click', () => playClickSound());
    nextQuestionBtn.addEventListener('click', () => playClickSound());
    tryAgainBtn.addEventListener('click', () => playClickSound());

    function playClickSound() {
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.log("Sound play failed:", e));
    }

    // --- Screen Transition Logic (from the beginning) ---
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => transitionTo(teacherSelectContainer, landingContainer));
    }
    avatarButtons.forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(() => {
                relaxSound.currentTime = 0;
                relaxSound.play().catch(e => console.log("Sound play failed:", e));
            }, 2000);
            transitionTo(preparationContainer, teacherSelectContainer);
            setTimeout(() => {
                doneBtn.style.display = 'inline-block';
                doneBtn.classList.add('fade-in');
            }, 8000);
        });
    });
    doneBtn.addEventListener('click', () => transitionTo(qaContainer, preparationContainer));

    // --- Generate Audio Button Logic ---
    generateBtn.addEventListener('click', async () => {
        const questionText = questionInput.value.trim();
        const answerText = answerInput.value.trim();

        if (!questionText || !answerText) {
            alert('Please enter both a question and an answer.');
            return;
        }
        
        showLoadingSpinner(true);

        try {
            // This now calls your LIVE Render backend URL
            const response = await fetch(`${BACKEND_URL}/generate-tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: answerText })
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

    // --- Challenge & Answer Check Logic ---
    challengeBtn.addEventListener('click', () => {
        displayQuestion.textContent = currentQuestion;
        userAnswerInput.value = '';
        challengeResultContainer.classList.add('hidden');
        nextQuestionBtn.classList.add('hidden');
        tryAgainBtn.classList.add('hidden');
        transitionTo(challengeContainer, qaContainer);
    });

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

    tryAgainBtn.addEventListener('click', () => {
        userAnswerInput.value = '';
        userAnswerInput.focus();
        challengeResultContainer.classList.add('hidden');
    });

    nextQuestionBtn.addEventListener('click', () => {
        questionInput.value = '';
        answerInput.value = '';
        ttsResultContainer.classList.add('hidden');
        transitionTo(qaContainer, challengeContainer);
    });
    
    // --- Helper Functions ---
    function showLoadingSpinner(show) {
        loadingSpinner.classList.toggle('hidden', !show);
    }
    
    function transitionTo(nextScreen, currentScreen) {
        if (currentScreen) {
            currentScreen.classList.add('fade-out');
            setTimeout(() => {
                currentScreen.style.display = 'none';
            }, 500);
        }
        setTimeout(() => {
            // Find the right display type for the screen
            const isFlex = nextScreen.id !== 'landing-container';
            nextScreen.style.display = isFlex ? 'flex' : 'block'; 
            
            setTimeout(() => {
                nextScreen.classList.remove('fade-out');
            }, 20);
        }, currentScreen ? 500 : 0);
    }
});
