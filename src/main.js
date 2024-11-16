import { parseWorkoutCSV } from './modules/parser.js';
import { setupEventListeners } from './modules/events.js';
import { createWeekCard, createContinueCard, findNextUncompletedWeek } from './modules/ui.js';

async function loadWorkout() {
    try {
        const response = await fetch('workout.csv');
        const csvText = await response.text();
        const workoutData = parseWorkoutCSV(csvText);
        displayWeeksGrid(workoutData);
    } catch (error) {
        console.error('Error loading workout data:', error);
        document.getElementById('workout-list').innerHTML = 
            '<p class="error">Error loading workout data. Please make sure the CSV file is in the correct format.</p>';
    }
}

function displayWeeksGrid(workoutData) {
    const workoutList = document.getElementById('workout-list');
    workoutList.innerHTML = '';
    
    const weeksGrid = document.createElement('div');
    weeksGrid.className = 'weeks-grid';

    // Add Continue Workout card
    const nextWeek = findNextUncompletedWeek(workoutData);
    if (nextWeek) {
        const continueCard = createContinueCard(nextWeek, workoutData[nextWeek]);
        weeksGrid.appendChild(continueCard);
    }

    // Add regular week cards
    for (const [week, workouts] of Object.entries(workoutData)) {
        const weekCard = createWeekCard(week, workouts);
        weeksGrid.appendChild(weekCard);
    }

    workoutList.appendChild(weeksGrid);
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadWorkout();
}); 