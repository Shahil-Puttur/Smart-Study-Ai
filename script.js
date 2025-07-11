document.addEventListener('DOMContentLoaded', () => {

    // --- State Management & Backend URL ---
    let currentQuestion = '';
    let currentAnswer = '';
    let selectedTeacherGender = 'female'; // Default to female
    const BACKEND_URL = 'https://smart-study-ai.onrender.com';

    // (Keep all your old element selectors)
    // ...

    // --- Sound Logic for Standard Buttons ---
    // (Keep all old sound logic)
    // ...

    // --- Screen Transition Logic ---
    // (Keep all old transition logic, but update the avatar button listener)
    
    avatarButtons.forEach(button => {
        button.addEventListener('click', () => {
            // ▼▼▼ NEW: Store the selected gender ▼▼▼
            selectedTeacherGender = button.dataset.teacher.toLowerCase();
            
            // The rest of the logic remains the same
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

    // (Keep the rest of the transition logic)
    // ...

    // --- Generate Audio Button Logic (UPDATED) ---
    generateBtn.addEventListener('click', async () => {
        const questionText = questionInput.value.trim();
        const answerText = answerInput.value.trim();

        if (!questionText || !answerText) {
            alert('Please enter both a question and an answer.');
            return;
        }
        
        showLoadingSpinner(true);

        try {
            // ▼▼▼ NEW: Send question, answer, AND gender to the backend ▼▼▼
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
                throw new Error('Failed to generate audio from backend.');
            }

            const data = await response.json();
            audioPlayer.src = data.audio_url;
            
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

    // (The rest of your JS file (challenge logic, helpers) can remain the same)
});
