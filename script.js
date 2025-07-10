document.addEventListener('DOMContentLoaded', () => {

    // --- Sound Effect Setup ---
    const clickSound = document.getElementById('click-sound');
    const allButtons = document.querySelectorAll('button');

    // Add sound to EVERY button on the page
    allButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Rewind sound to the beginning to allow for rapid clicks
            clickSound.currentTime = 0;
            clickSound.play();
        });
    });

    // --- Screen Transition Logic ---
    const landingContainer = document.getElementById('landing-container');
    const teacherSelectContainer = document.getElementById('teacher-select-container');
    const getStartedBtn = document.getElementById('getStartedBtn');

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            // 1. Add 'hidden' class to fade out the landing screen
            landingContainer.classList.remove('visible');
            landingContainer.classList.add('hidden');

            // 2. After the fade-out animation is done, show the next screen
            setTimeout(() => {
                // 3. Add 'visible' to fade in the teacher selection screen
                teacherSelectContainer.classList.remove('hidden');
                teacherSelectContainer.classList.add('visible');
            }, 500); // This time must match the CSS transition duration
        });
    }

    // --- Teacher Selection Logic ---
    const avatarButtons = document.querySelectorAll('.avatar-button');

    avatarButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedTeacher = button.dataset.teacher;
            alert(`You selected the ${selectedTeacher} Teacher! Ready to learn.`);
            // You can add code here to go to the next page or start the main app
        });
    });

});
