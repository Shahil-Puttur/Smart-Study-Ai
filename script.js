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
    // ▼▼▼ RENAMED VARIABLE FROM breathingGif TO breathingImage ▼▼▼
    const breathingImage = document.getElementById('breathingImage');

    // ▼▼▼ UPDATED CACHE-BUSTING FOR THE PNG IMAGE ▼▼▼
    if (breathingImage) {
        // Appends a unique timestamp to the image's URL to prevent caching
        breathingImage.src = `relaxing.png?t=${new Date().getTime()}`;
    }
    
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
            const selectedTeacher = button.dataset.teacher;
            console.log(`Selected the ${selectedTeacher} Teacher.`);

            // Plays the relax sound after a 2-second delay
            setTimeout(() => {
                relaxSound.currentTime = 0;
                relaxSound.play().catch(e => console.log("Sound play failed:", e));
            }, 2000);

            transitionTo(preparationContainer, teacherSelectContainer);
        });
    });
    
    // --- Logic for the 'Next' button on the preparation screen ---
    nextStepBtn.addEventListener('click', () => {
        alert("Going to Step 2!");
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
