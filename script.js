document.addEventListener('DOMContentLoaded', () => {

    // --- State Management ---
    let currentQuestion = '';
    let currentAnswer = '';
    // IMPORTANT: Change this to your Render URL when you deploy!
    const BACKEND_URL = 'http://127.0.0.1:5000'; 

    // --- Element Selection (all screens) ---
    const allScreens = document.querySelectorAll('.screen');
    const getStartedBtn = document.getElementById('getStartedBtn');
    // ... (other old selectors)
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

    // ... (All previous sound logic and event listeners for the first 3 screens remain the same)
    
    // --- Event Listener for the "Done" button on the prep screen ---
    doneBtn.addEventListener('click', () => {
        transitionTo(qaContainer, preparationContainer);
    });

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
            const response = await fetch(`${BACKEND_URL}/generate-tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: answerText })
            });

            if (!response.ok) {
                throw new Error('Failed to generate audio.');
            }

            const data = await response.json();
            audioPlayer.src = data.audio_url;
            
            // Store for the challenge
            currentQuestion = questionText;
            currentAnswer = answerText;

            ttsResultContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Error:', error);
            alert('Sorry, there was an error generating the audio. Please try again.');
        } finally {
            showLoadingSpinner(false);
        }
    });

    // --- Challenge Me! Button Logic ---
    challengeBtn.addEventListener('click', () => {
        displayQuestion.textContent = currentQuestion;
        userAnswerInput.value = ''; // Clear previous attempts
        challengeResultContainer.classList.add('hidden'); // Hide old results
        nextQuestionBtn.classList.add('hidden');
        tryAgainBtn.classList.add('hidden');
        transitionTo(challengeContainer, qaContainer);
    });

    // --- Check Answer Button Logic ---
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

    // --- Try Again & Next Question Logic ---
    tryAgainBtn.addEventListener('click', () => {
        userAnswerInput.value = '';
        userAnswerInput.focus();
        challengeResultContainer.classList.add('hidden');
    });

    nextQuestionBtn.addEventListener('click', () => {
        // Reset the Q&A form for a new card
        questionInput.value = '';
        answerInput.value = '';
        ttsResultContainer.classList.add('hidden');
        transitionTo(qaContainer, challengeContainer);
    });
    
    // --- Helper Functions ---
    function showLoadingSpinner(show) {
        loadingSpinner.classList.toggle('hidden', !show);
    }
    
    // (The reusable transitionTo function remains the same)
});
