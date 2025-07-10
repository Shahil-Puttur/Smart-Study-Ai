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
    const nextStepBtn = document.getElementById('nextStepBtn');

    // --- Sound Logic for Standard Buttons ---
    getStartedBtn.addEventListener('click', () => playClickSound());
    nextStepBtn.addEventListener('click', () => playClickSound());

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
            // Play the special relax sound INSTEAD of the click sound
            relaxSound.currentTime = 0;
            relaxSound.play().catch(e => console.log("Sound play failed:", e));

            const selectedTeacher = button.dataset.teacher;
            console.log(`Selected the ${selectedTeacher} Teacher.`);

            // Transition to the preparation screen
            transitionTo(preparationContainer, teacherSelectContainer);
        });
    });
    
    // --- Logic for the 'Next' button on the preparation screen ---
    nextStepBtn.addEventListener('click', () => {
        alert("Going to Step 2!");
        // You can add logic here to transition to the next step
    });

    // --- Reusable Transition Function ---
    function transitionTo(nextScreen, currentScreen) {
        if (currentScreen) {
            currentScreen.classList.add('fade-out');
            setTimeout(() => {
                currentScreen.style.display = 'none';
            }, 500); // Wait for fade-out to finish
        }

        setTimeout(() => {
            nextScreen.style.display = 'flex';
            // A tiny delay to ensure the 'display' change is registered before changing opacity
            setTimeout(() => {
                nextScreen.classList.remove('fade-out');
            }, 20);
        }, currentScreen ? 500 : 0);
    }
});
