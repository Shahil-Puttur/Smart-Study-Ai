document.addEventListener('DOMContentLoaded', () => {

    // (Keep all your existing state variables and element selectors from the last version)
    // ...

    // --- THE NEW AUDIO ORCHESTRATOR LOGIC ---
    
    // Helper function to call our new backend endpoint
    async function getAudioUrl(text, gender) {
        const response = await fetch(`${BACKEND_URL}/generate-single-tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, gender })
        });
        if (!response.ok) {
            throw new Error('Backend failed to generate an audio clip.');
        }
        const data = await response.json();
        return data.audio_url;
    }

    // Function to play the audio clips in sequence with perfect timing
    function playPacedAudio(questionUrl, answerUrl) {
        const questionAudio = new Audio(questionUrl);
        const answerAudio = new Audio(answerUrl);

        console.log("Orchestrating audio playback...");

        // Step 1: 1-second initial pause
        setTimeout(() => {
            console.log("Playing question...");
            questionAudio.play();
        }, 1000); // 1-second delay

        // Step 2: When the question finishes, wait 2 seconds, then play the answer
        questionAudio.addEventListener('ended', () => {
            console.log("Question finished. Starting 2-second pause...");
            setTimeout(() => {
                console.log("Playing answer...");
                answerAudio.play();
            }, 2000); // 2-second delay
        });

        // We can still show the final combined audio player for replay,
        // but the initial playback is now controlled by us.
        // For simplicity, we will just use the answer audio in the player for now.
        audioPlayer.src = answerUrl; 
    }

    // --- Generate Audio Button Logic (Completely Rewritten) ---
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
                console.log("Requesting Question and Answer audio from backend...");
                
                // Make two API calls concurrently for speed
                const [questionUrl, answerUrl] = await Promise.all([
                    getAudioUrl(questionText, selectedTeacherGender),
                    getAudioUrl(answerText, selectedTeacherGender)
                ]);

                console.log("Audio URLs received:", { questionUrl, answerUrl });
                
                // The magic happens here:
                playPacedAudio(questionUrl, answerUrl);
                
                // Store for the challenge
                currentQuestion = questionText;
                currentAnswer = answerText;

                // Show the controls and challenge button
                ttsResultContainer.classList.remove('hidden');

            } catch (error) {
                console.error('Error during audio generation:', error);
                alert(`Sorry, there was a critical error: ${error.message}`);
            } finally {
                showLoadingSpinner(false);
            }
        });
    }

    // (The rest of your JS file (challenge logic, helpers, other event listeners) can remain exactly the same)
    // ...
});
