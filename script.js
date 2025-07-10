document.addEventListener('DOMContentLoaded', () => {

    // --- Sound Effect Setup ---
    const clickSound = document.getElementById('click-sound');
    const relaxSound = document.getElementById('relax-sound');

    // --- Element Selection ---
    const landingContainer = document.getElementById('landing-container');
    const teacherSelectContainer = document.getElementById('teacher-select-container');
    const preparationContainer = document.getElementById('preparation-container');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const avatarButtons = document.querySelectorAll('.avatar-button');
    const doneBtn = document.getElementById('doneBtn'); // Changed from nextStepBtn
    const breathingImage = document.getElementById('breathingImage');

    // Cache-busting for the image to ensure the latest version is loaded
    if (breathingImage) {
        breathingImage.src = `relaxing.png?t=${new Date().getTime()}`;
    }
    
    // --- Sound Logic for Standard Buttons ---
    getStartedBtn.addEventListener('click', () => playClickSound());
    doneBtn.addEventListener('click', () => playClickSound()); // Now targeting doneBtn

    function playClickSound() {
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.log("Sound play failed:", e));
    }

    // --- Transition 1: Landing -> Teacher Select ---
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            transitionTo(teacherSelectContainer, landingContainer);
        });
    }

    // --- Transition 2: Teacher Select -> Preparation ---
    avatarButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedTeacher = button.dataset.teacher;
            console.log(`Selected the ${selectedTeacher} Teacher.`);

            // Plays the relax sound after a 2-second delay
            setTimeout(() => {
                relaxSound.currentTime = 0;
                relaxSound.play().catch(e => console.log("Sound play failed:", e));
            }, 2000);

            // Transition to the preparation screen
            transitionTo(preparationContainer, teacherSelectContainer);
            
            // ▼▼▼ DELAYED BUTTON LOGIC: Show the button after 8 seconds ▼▼▼
            setTimeout(() => {
                doneBtn.style.display = 'inline-block'; // Make it visible
                doneBtn.classList.add('fade-in'); // Trigger the fade-in animation
            }, 8000); // 8000 milliseconds = 8 seconds
        });
    });
    
    // --- Logic for the 'Done' button ---
    doneBtn.addEventListener('click', () => {
        alert("Breathing exercise complete! Ready to start the lesson.");
        // Add logic here to go to the main study screen
    });

    // --- Reusable Transition Function ---
    function transitionTo(nextScreen, currentScreen) {
        if (currentScreen) {
            currentScreen.classList.add('fade-out');
            setTimeout(() => {
                currentScreen.style.display = 'none';
            }, 500);
        }
        setTimeout(() => {
            nextScreen.style.display = 'flex';
            setTimeout(() => {
                nextScreen.classList.remove('fade-out');
            }, 20);
        }, currentScreen ? 500 : 0);
    }
});
