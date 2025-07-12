document.addEventListener('DOMContentLoaded', () => {

    // --- State Management ---
    let currentQuestion = '';
    let currentAnswer = '';
    let selectedTeacherGender = 'female';
    let currentQuestionUrl = ''; // Stores the URL for the question audio
    let currentAnswerUrl = '';   // Stores the URL for the answer audio
    const BACKEND_URL = 'https://smart-study-ai.onrender.com';

    // --- Element Selectors ---
    const getElement = (id) => document.getElementById(id);
    const clickSound = getElement('click-sound');
    const relaxSound = getElement('relax-sound');
    const congratsSound = getElement('congrats-sound');
    const generateBtn = getElement('generateBtn');
    const ttsResultContainer = getElement('ttsResultContainer');
    const loadingSpinner = getElement('loading-spinner');
    const questionInput = getElement('questionInput');
    const answerInput = getElement('answerInput');
    
    // NEW Custom Player Elements
    const playAgainBtn = getElement('playAgainBtn');
    const audioStatus = getElement('audioStatus');

    // (All other selectors for screens and buttons remain the same)
    const getStartedBtn = getElement('getStartedBtn');
    const avatarButtons = document.querySelectorAll('.avatar-button');
    const doneBtn = getElement('doneBtn');
    // ...etc.

    // --- Core Application Flow & Logic ---

    // (The transitionTo function and initial screen listeners remain the same. Copy from previous version)
    function transitionTo(nextScreenId) {
        document.querySelector('.screen.active')?.classList.remove('active');
        getElement(nextScreenId)?.classList.add('active');
    }
    //... add all the listeners for getStartedBtn, avatarButtons, doneBtn, etc. here

    // --- The Final Audio Orchestrator Logic ---
    
    async function getAudioUrl(text, gender) {
        const response = await fetch(`${BACKEND_URL}/generate-single-tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, gender })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Backend failed to generate an audio clip.');
        }
        const data = await response.json();
        return data.audio_url;
    }

    function playPacedAudio(questionUrl, answerUrl) {
        const questionAudio = new Audio(questionUrl);
        const answerAudio = new Audio(answerUrl);

        // Disable the button during playback to prevent spamming
        playAgainBtn.disabled = true;

        const playAnswer = () => {
            audioStatus.textContent = "Playing Answer...";
            setTimeout(() => {
                answerAudio.play();
            }, 1000); // UPGRADE: Pause is now 1 second
        };

        const onPlaybackEnd = () => {
            audioStatus.textContent = "Click to play again";
            playAgainBtn.disabled = false; // Re-enable the button
        };

        questionAudio.addEventListener('ended', playAnswer);
        answerAudio.addEventListener('ended', onPlaybackEnd);
        
        // Start the sequence
        audioStatus.textContent = "Playing Question...";
        questionAudio.play();
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            playClickSound(); // Play standard click sound
            const questionText = `Question: ${questionInput.value.trim()}`;
            const answerText = `Answer: ${answerInput.value.trim()}`;
            if (!questionInput.value.trim() || !answerInput.value.trim()) return alert('Please enter both a question and an answer.');
            
            showLoadingSpinner(true);
            try {
                const [questionUrl, answerUrl] = await Promise.all([
                    getAudioUrl(questionText, selectedTeacherGender),
                    getAudioUrl(answerText, selectedTeacherGender)
                ]);

                // Store the URLs for the "Play Again" button
                currentQuestionUrl = questionUrl;
                currentAnswerUrl = answerUrl;
                
                // UPGRADE: Autoplay the sequence the first time
                playPacedAudio(currentQuestionUrl, currentAnswerUrl);
                
                currentQuestion = questionInput.value.trim();
                currentAnswer = answerInput.value.trim();
                
                ttsResultContainer.classList.remove('hidden');

            } catch (error) {
                console.error('Error during audio generation:', error);
                alert(`Sorry, a critical error occurred: ${error.message}`);
            } finally {
                showLoadingSpinner(false);
            }
        });
    }

    // UPGRADE: Add listener for the new "Play Again" button
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            if (currentQuestionUrl && currentAnswerUrl) {
                playPacedAudio(currentQuestionUrl, currentAnswerUrl);
            }
        });
    }
    
    // (The rest of your challenge logic and helper functions remain the same)
    //...
});
