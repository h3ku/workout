// Storage related functions
export const COMPLETED_WEEKS_KEY = 'completedWorkoutWeeks';
export const WORKOUT_STATES_KEY = 'workoutDropdownStates';

export const completedWeeks = new Set(JSON.parse(localStorage.getItem(COMPLETED_WEEKS_KEY) || '[]'));
export const workoutStates = JSON.parse(localStorage.getItem(WORKOUT_STATES_KEY) || '{}');

export function saveCompletedWeeks() {
    localStorage.setItem(COMPLETED_WEEKS_KEY, JSON.stringify([...completedWeeks]));
}

export function saveWorkoutStates() {
    localStorage.setItem(WORKOUT_STATES_KEY, JSON.stringify(workoutStates));
} 