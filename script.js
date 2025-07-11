document.addEventListener('DOMContentLoaded', () => {

    // --- State Management & Backend URL ---
    let currentQuestion = '';
    let currentAnswer = '';
    let selectedTeacherGender = 'female'; // Default gender
    const BACKEND_URL = 'https://smart-study-ai.onrender.com';

    // --- Sound Effect Setup ---
    const clickSound = document.getElementById('click-sound');
    const relaxSound = document.getElementById('relax-sound');

    // --- Element Selection (Robust Method) ---
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

    // --- Initial Setup & Sound Listeners ---
    if (breathingImage) {
        breathingImage.src = `relaxing.png?t=${new Date().getTime()}`;
    }

    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        // We handle the relax sound separately
        if (button.classList.contains('avatar-button')) return;
        button.addEventListener('click', playClickSound);
    });

    function playClickSound() {
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.error("Click sound failed:", e));
        }
    }

    // --- Core Application Flow ---

    // 1. Landing -> Teacher Select
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            transitionTo(teacherSelectContainer, landingContainer);
        });
    }
    
    // 2. Teacher Select -> Preparation
    avatarButtons.forEach(button => {
        button.addEventListener('click', () => {
            playClickSound(); // Play the standard click sound immediately
            selectedTeacherGender = button.dataset.teacher.toLowerCase();
            
            // Play relax sound after a delay
            setTimeout(() => {
                if(relaxSound) {
                    relaxSound.currentTime = 0;
                    relaxSound.play().catch(e => console.error("Relax sound failed:", e));
                }
            }, 2000);

            // Transition to the prep screen
            transitionTo(preparationContainer, teacherSelectContainer);

            // Show the "Done" button after the breathing exercise duration
            setTimeout(() => {
                if(doneBtn) {
                    doneBtn.style.display = 'inline-block';
                    doneBtn.classList.add('fade-in');
                }
            }, 8000);
        });
    });
    
    // 3. Preparation -> Q&A Input
    if (doneBtn) {
        doneBtn.addEventListener('click', () => transitionTo(qaContainer, preparationContainer));
    }

    // 4. Generate Audio (The Orchestrator)
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

    // 5. Q&A -> Challenge
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

    // 6. Challenge Answer Check
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

    // 7. Challenge -> Loop back
    if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => {
        userAnswerInput.value = '';
        userAnswerInput.focus();
        challengeResultContainer.classList.add('hidden');
    });

    if (nextQuestionBtn) nextQuestionBtn.addEventListener('click', () => {
        questionInput.value = '';
        answerInput.value = '';
        ttsResultContainer.classList.add('hidden');
        transitionTo(qaContainer, challengeContainer);
    });

    // --- Helper Functions ---
    
    function showLoadingSpinner(show) {
        if(loadingSpinner) loadingSpinner.classList.toggle('hidden', !show);
    }

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

    // ▼▼▼ THIS IS THE FIXED TRANSITION FUNCTION ▼▼▼
    function transitionTo(nextScreen, currentScreen) {
        if (currentScreen) {
            currentScreen.style.display = 'none'; // Hide current screen immediately
        }
        if (nextScreen) {
            nextScreen.style.display = 'flex'; // Show next screen immediately
            // Add fade-in effect
            nextScreen.classList.remove('fade-out'); 
        }
    }
});
