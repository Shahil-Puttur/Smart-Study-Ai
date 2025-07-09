// This script is primarily for future functionality.
// The current animations are all handled by CSS for performance.

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('.start-button');

    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Transformation journey started!');
            alert('Welcome! Let\'s begin your transformation.');
        });
    }

    // A little extra touch: add a class to the panels when they are hovered
    // to potentially trigger more complex JS animations in the future.
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
        panel.addEventListener('mouseenter', () => {
            panel.classList.add('hovering');
        });
        panel.addEventListener('mouseleave', () => {
            panel.classList.remove('hovering');
        });
    });
});
