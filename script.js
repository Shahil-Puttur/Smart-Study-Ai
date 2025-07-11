document.addEventListener('DOMContentLoaded', () => {

    // (All state variables, selectors, and helper functions from the last version remain the same)
    let currentQuestion = '';
    let currentAnswer = '';
    let selectedTeacherGender = 'female';
    const BACKEND_URL = 'https://smart-study-ai.onrender.com';

    const getElement = (id) => document.getElementById(id);
    // ... all other getElement calls
    
    // --- THIS IS THE NEW, BULLETPROOF TRANSITION FUNCTION ---
    function transitionTo(nextScreenId) {
        // Find the screen that is currently active and deactivate it
        const currentActiveScreen = document.querySelector('.screen.active');
        if (currentActiveScreen) {
            currentActiveScreen.classList.remove('active');
        }

        // Find the target screen by its ID and activate it
        const nextScreen = getElement(nextScreenId);
        if (nextScreen) {
            nextScreen.classList.add('active');
        } else {
            console.error(`Screen with ID '${nextScreenId}' not found!`);
        }
    }

    // --- Core Application Flow (Now using the new transition function) ---
    const clickSound = getElement('click-sound');
    const relaxSound = getElement('relax-sound');
    
    // 1. Landing -> Teacher Select
    const getStartedBtn = getElement('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            playClickSound();
            transitionTo('teacher-select-container');
        });
    }
    
    // 2. Teacher Select -> Preparation
    const avatarButtons = document.querySelectorAll('.avatar-button');
    const doneBtn = getElement('doneBtn');
    avatarButtons.forEach(button => {
        button.addEventListener('click', () => {
            playClickSound();
            selectedTeacherGender = button.dataset.teacher.toLowerCase();
            setTimeout(() => {
                if(relaxSound) relaxSound.play().catch(e => console.error(e));
            }, 2000);
            transitionTo('preparation-container');
            setTimeout(() => {
                if(doneBtn) {
                    doneBtn.style.opacity = '1';
                    doneBtn.style.pointerEvents = 'auto';
                }
            }, 8000);
        });
    });
    
    // 3. Preparation -> Q&A Input
    if (doneBtn) {
        doneBtn.addEventListener('click', () => transitionTo('qa-container'));
    }

    // (The rest of the code for generating audio and handling challenges remains the same)
    const qaContainer = getElement('qa-container');
    const challengeContainer = getElement('challenge-container');
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
    const loadingSpinner = getElement('loading-spinner');
    
    // Helper function to play click sound
    function playClickSound() {
        if(clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.error(e));
        }
    }
    
    // Generate Audio (The Orchestrator)
    async function getAudioUrl(text, gender) {
        const response = await fetch(`${BACKEND_URL}/generate-single-tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, gender })
        });
        if (!response.ok) throw new Error('Backend failed to generate an audio clip.');
        const data = await response.json();
        return data.audio_url;
    }

    function playPacedAudio(questionUrl, answerUrl) {
        const questionAudio = new Audio(questionUrl);
        const answerAudio = new Audio(answerUrl);
        setTimeout(() => questionAudio.play(), 1000);
        questionAudio.addEventListener('ended', () => {
            setTimeout(() => answerAudio.play(), 2000);
        });
        audioPlayer.src = answerUrl;
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            playClickSound();
            const questionText = questionInput.value.trim();
            const answerText = answerInput.value.trim();
            if (!questionText || !answerText) {
                alert('Please enter both a question and an answer.');
                return;
            }
            showLoadingSpinner(true);
            try {
                const [questionUrl, answerUrl] = await Promise.all([
                    getAudioUrl(questionText, selectedTeacherGender),
                    getAudioUrl(answerText, selectedTeacherGender)
                ]);
                playPacedAudio(questionUrl, answerUrl);
                currentQuestion = questionText;
                currentAnswer = answerText;
                ttsResultContainer.classList.remove('hidden');
            } catch (error) {
                console.error('Error during audio generation:', error);
                alert(`Sorry, a critical error occurred: ${error.message}`);
            } finally {
                showLoadingSpinner(false);
            }
        });
    }

    if (challengeBtn) challengeBtn.addEventListener('click', () => {
        playClickSound();
        displayQuestion.textContent = currentQuestion;
        userAnswerInput.value = '';
        challengeResultContainer.classList.add('hidden');
        nextQuestionBtn.classList.add('hidden');
        tryAgainBtn.classList.add('hidden');
        transitionTo('challenge-container');
    });

    if (checkAnswerBtn) checkAnswerBtn.addEventListener('click', () => {
        playClickSound();
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

    if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => {
        playClickSound();
        userAnswerInput.value = '';
        userAnswerInput.focus();
        challengeResultContainer.classList.add('hidden');
    });

    if (nextQuestionBtn) nextQuestionBtn.addEventListener('click', () => {
        playClickSound();
        questionInput.value = '';
        answerInput.value = '';
        ttsResultContainer.classList.add('hidden');
        transitionTo('qa-container');
    });
    
    function showLoadingSpinner(show) {
        if(loadingSpinner) loadingSpinner.classList.toggle('hidden', !show);
    }
});
