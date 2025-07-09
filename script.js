document.addEventListener('DOMContentLoaded', () => {

    const startButton = document.getElementById('startButton');

    if (startButton) {
        startButton.addEventListener('click', () => {
            // A more professional console log message
            console.log('Initializing learning session...');

            // Change button text to show feedback
            startButton.textContent = 'LOADING...';
            startButton.style.cursor = 'wait';

            // Simulate loading and then show an alert
            setTimeout(() => {
                alert('Welcome! Your smart learning buddy is ready.');
                // Reset button after the action
                startButton.textContent = 'START';
                startButton.style.cursor = 'pointer';
            }, 1500); // 1.5-second delay
        });
    }

});
