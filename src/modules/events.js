// Event handlers
import { startTimer } from './timer.js';
import { workoutStates, saveWorkoutStates } from './storage.js';

export function setupEventListeners() {
    document.addEventListener('click', (e) => {
        // Handle timer clicks first and prevent bubbling
        if (e.target.classList.contains('timer-button')) {
            e.stopPropagation(); // Stop the event from bubbling up
            const restTime = Number.parseInt(e.target.dataset.restTime, 10);
            startTimer(e.target, restTime);
            return; // Exit early
        }

        // Handle other clicks
        handleExerciseToggle(e);
        handleWorkoutTypeToggle(e);
    });
}

function handleExerciseToggle(e) {
    const exerciseHeader = e.target.closest('.exercise-header');
    if (exerciseHeader) {
        const exerciseCard = exerciseHeader.closest('.exercise-card');
        if (exerciseCard) {
            exerciseCard.classList.toggle('active');
        }
    }
}

function handleWorkoutTypeToggle(e) {
    const workoutHeader = e.target.closest('.workout-header');
    if (workoutHeader) {
        const workoutType = workoutHeader.closest('.workout-type');
        if (workoutType) {
            const workoutId = workoutType.dataset.workoutId;
            const exercisesContainer = workoutType.querySelector('.workout-exercises');
            const indicator = workoutType.querySelector('.workout-dropdown-indicator');
            
            const isOpen = exercisesContainer.classList.contains('open');
            
            // Update the state
            workoutStates[workoutId] = !isOpen;
            saveWorkoutStates();
            
            // Toggle classes
            exercisesContainer.classList.toggle('open');
            indicator.classList.toggle('open');
        }
    }
} 