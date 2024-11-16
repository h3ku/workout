// Timer functionality
export const activeTimers = new Map();

export function startTimer(timerButton, seconds) {
    const timerId = activeTimers.get(timerButton);
    const timerDisplay = timerButton.nextElementSibling;
    
    if (timerId) {
        clearInterval(timerId);
        activeTimers.delete(timerButton);
        timerButton.disabled = false;
        timerButton.classList.remove('running');
        timerDisplay.textContent = '';
        return;
    }

    timerButton.classList.add('running');
    let timeLeft = seconds;
    
    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const newTimerId = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(newTimerId);
            activeTimers.delete(timerButton);
            timerButton.classList.remove('running');
            timerDisplay.textContent = '';
            new Audio('data:audio/wav;base64,...').play(); // Base64 audio string here
        }
    }, 1000);

    activeTimers.set(timerButton, newTimerId);
    updateDisplay();
} 