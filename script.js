document.addEventListener('DOMContentLoaded', () => {

    let currentQuestion = '';
    let currentAnswer = '';
    let selectedTeacherGender = 'female';
    const BACKEND_URL = 'https://smart-study-ai.onrender.com';

    const getElement = (id) => document.getElementById(id);
    const clickSound = getElement('click-sound');
    const relaxSound = getElement('relax-sound');
    const congratsSound = getElement('congrats-sound');
    const getStartedBtn = getElement('getStartedBtn');
    const avatarButtons = document.querySelectorAll('.avatar-button');
    const doneBtn = getElement('doneBtn');
    const breathingImage = getElement('breathingImage');
    const generateBtn = getElement('generateBtn');
    const challengeBtn = getElement('challengeBtn');
    const checkAnswerBtn = getElement('checkAnswerBtn');
    const tryAgainBtn = getElement('tryAgainBtn');
    const nextQuestionBtn = getElement('nextQuestionBtn');
    const loadingSpinner = getElement('loading-spinner');
    const questionInput = getElement('questionInput');
    const answerInput = getElement('answerInput');
    const ttsResultContainer = getElement('ttsResultContainer');
    const audioPlayer = getElement('audioPlayer');
    const displayQuestion = getElement('displayQuestion');
    const userAnswerInput = getElement('userAnswerInput');
    const challengeResultContainer = getElement('challengeResultContainer');
    const resultMessage = getElement('resultMessage');

    if (breathingImage) {
        breathingImage.src = `relaxing.png?t=${new Date().getTime()}`;
    }

    function playClickSound() {
        if(clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.error(e));
        }
    }
    
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', playClickSound);
    });

    function transitionTo(nextScreenId) {
        document.querySelector('.screen.active')?.classList.remove('active');
        getElement(nextScreenId)?.classList.add('active');
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => transitionTo('teacher-select-container'));
    }
    
    avatarButtons.forEach(button => {
        button.addEventListener('click', () => {
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
    
    if (doneBtn) {
        doneBtn.addEventListener('click', () => transitionTo('qa-container'));
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const questionText = questionInput.value.trim();
            const answerText = answerInput.value.trim();
            if (!questionText || !answerText) return alert('Please enter both a question and an answer.');
            
            showLoadingSpinner(true);
            try {
                const response = await fetch(`${BACKEND_URL}/generate-paced-tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        question: questionText, 
                        answer: answerText, 
                        gender: selectedTeacherGender 
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Backend failed to generate audio.');
                }
                
                const data = await response.json();
                
                audioPlayer.src = data.audio_url;
                
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
                if (congratsSound) {
                    congratsSound.currentTime = 0;
                    congratsSound.play();
                }
            } else {
                resultMessage.textContent = "Good try, you're almost there! Let's go again. 💪";
                resultMessage.className = 'error';
                tryAgainBtn.classList.remove('hidden');
                nextQuestionBtn.classList.add('hidden');
            }
        });
    }

    if (challengeBtn) challengeBtn.addEventListener('click', () => {
        displayQuestion.textContent = currentQuestion;
        userAnswerInput.value = '';
        challengeResultContainer.classList.add('hidden');
        nextQuestionBtn.classList.add('hidden');
        tryAgainBtn.classList.add('hidden');
        transitionTo('challenge-container');
    });

    if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => {
        userAnswerInput.value = '';
        userAnswerInput.focus();
        challengeResultContainer.classList.add('hidden');
    });

    if (nextQuestionBtn) nextQuestionBtn.addEventListener('click', () => {
        questionInput.value = '';
        answerInput.value = '';
        ttsResultContainer.classList.add('hidden');
        transitionTo('qa-container');
    });
    
    function showLoadingSpinner(show) {
        if(loadingSpinner) loadingSpinner.classList.toggle('hidden', !show);
    }
});
