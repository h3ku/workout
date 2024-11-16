import { completedWeeks, workoutStates, saveWorkoutStates, saveCompletedWeeks } from './storage.js';
import { parseRestTime } from './parser.js';

export function findNextUncompletedWeek(workoutData) {
    return Object.keys(workoutData).find(week => !completedWeeks.has(week));
}

export function createExerciseCardHTML(exercise) {
    const restSeconds = parseRestTime(exercise.rest || '90s');
    
    return `
        <div class="exercise-card">
            <div class="exercise-header">
                <div class="exercise-title">
                    <h4>${exercise.exercise}</h4>
                    <div class="exercise-metrics">
                        <span class="metric">Warm-up: ${exercise.warmUpSets || 'N/A'}</span>
                        <span class="metric">Sets: ${exercise.workingSets || 'N/A'}</span>
                        <span class="metric">Reps: ${exercise.reps || 'N/A'}</span>
                        <span class="metric rest-metric">
                            Rest: ${exercise.rest || 'N/A'}
                            <button class="timer-button" data-rest-time="${restSeconds}">⏱️</button>
                            <span class="timer-display"></span>
                        </span>
                        <span class="metric rpe">RPE: ${exercise.rpe || 'N/A'}</span>
                    </div>
                </div>
                <div class="dropdown-indicator">▼</div>
            </div>
            <div class="exercise-details">
                <div class="substitutions">
                    <p><strong>Substitution 1:</strong> ${exercise.sub1 || 'None'}</p>
                    <p><strong>Substitution 2:</strong> ${exercise.sub2 || 'None'}</p>
                </div>
                <div class="notes">
                    <p><strong>Instructions:</strong> ${exercise.notes || 'No notes'}</p>
                </div>
            </div>
        </div>
    `;
}

export function createWeekCard(week, workouts) {
    const card = document.createElement('div');
    card.className = 'week-card';
    card.dataset.week = week;
    if (completedWeeks.has(week)) {
        card.classList.add('completed');
    }
    
    const totalExercises = Object.values(workouts)
        .reduce((sum, type) => sum + type.length, 0);

    card.innerHTML = `
        <h2>${week}</h2>
        <div class="week-summary">
            <p>${Object.keys(workouts).length} Workouts</p>
            <p>${totalExercises} Exercises</p>
        </div>
        <button class="complete-button ${completedWeeks.has(week) ? 'completed' : ''}">
            ${completedWeeks.has(week) ? 'Completed ✓' : 'Mark Complete'}
        </button>
    `;

    const weekDetails = createWeekDetails(week, workouts);
    setupWeekCardEventListeners(card, weekDetails, week);
    
    document.body.appendChild(weekDetails);
    return card;
}

export function createContinueCard(nextWeek, workouts) {
    const card = document.createElement('div');
    card.className = 'week-card continue-card';
    
    const totalExercises = Object.values(workouts)
        .reduce((sum, type) => sum + type.length, 0);

    card.innerHTML = `
        <h2>Continue Workout</h2>
        <div class="week-summary">
            <p>Next: ${nextWeek}</p>
            <p>${Object.keys(workouts).length} Workouts</p>
            <p>${totalExercises} Exercises</p>
        </div>
        <div class="continue-icon">▶</div>
    `;

    const weekDetails = createWeekDetails(nextWeek, workouts);
    setupWeekCardEventListeners(card, weekDetails, nextWeek);

    document.body.appendChild(weekDetails);
    return card;
}

export function createWeekContent(workouts) {
    let content = '';
    
    for (const [type, exercises] of Object.entries(workouts)) {
        const workoutId = `${type.replace(/\s+/g, '-').toLowerCase()}`;
        const isOpen = workoutStates[workoutId] || false;
        
        content += `
            <div class="workout-type" data-workout-id="${workoutId}">
                <div class="workout-header">
                    <h3>${type}</h3>
                    <div class="workout-dropdown-indicator ${isOpen ? 'open' : ''}">▼</div>
                </div>
                <div class="workout-exercises ${isOpen ? 'open' : ''}">
                    ${exercises.map(exercise => createExerciseCardHTML(exercise)).join('')}
                </div>
            </div>
        `;
    }
    
    return content;
}

function createWeekDetails(week, workouts) {
    const weekDetails = document.createElement('div');
    weekDetails.className = 'week-details';
    weekDetails.dataset.week = week;
    weekDetails.innerHTML = `
        <div class="week-content">
            <button class="close-button">×</button>
            <h2>${week}</h2>
            <button class="complete-button-large ${completedWeeks.has(week) ? 'completed' : ''}">
                ${completedWeeks.has(week) ? 'Completed ✓' : 'Mark Week as Complete'}
            </button>
            ${createWeekContent(workouts)}
        </div>
    `;
    return weekDetails;
}

function setupWeekCardEventListeners(card, weekDetails, week) {
    card.addEventListener('click', () => {
        weekDetails.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    weekDetails.querySelector('.close-button').addEventListener('click', (e) => {
        e.stopPropagation();
        weekDetails.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    weekDetails.addEventListener('click', (e) => {
        if (e.target === weekDetails) {
            weekDetails.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    const completeButton = card.querySelector('.complete-button');
    if (completeButton) {
        completeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWeekCompletion(week, card, weekDetails);
        });
    }

    const completeButtonLarge = weekDetails.querySelector('.complete-button-large');
    if (completeButtonLarge) {
        completeButtonLarge.addEventListener('click', () => {
            toggleWeekCompletion(week, card, weekDetails);
        });
    }
}

function toggleWeekCompletion(week, card, weekDetails) {
    const isCompleted = completedWeeks.has(week);
    const cardButton = card.querySelector('.complete-button');
    const modalButton = weekDetails.querySelector('.complete-button-large');
    
    if (isCompleted) {
        completedWeeks.delete(week);
        card.classList.remove('completed');
        if (cardButton) {
            cardButton.classList.remove('completed');
            cardButton.textContent = 'Mark Complete';
        }
        modalButton.classList.remove('completed');
        modalButton.textContent = 'Mark Week as Complete';
    } else {
        completedWeeks.add(week);
        card.classList.add('completed');
        if (cardButton) {
            cardButton.classList.add('completed');
            cardButton.textContent = 'Completed ✓';
        }
        modalButton.classList.add('completed');
        modalButton.textContent = 'Completed ✓';
    }
    
    saveCompletedWeeks();
    updateContinueCard();
}

export function updateContinueCard() {
    const continueCard = document.querySelector('.continue-card');
    if (!continueCard) return;

    const allWeekCards = Array.from(document.querySelectorAll('.week-card:not(.continue-card)'));
    const nextWeek = allWeekCards.find(card => !card.classList.contains('completed'));

    if (nextWeek) {
        updateContinueCardContent(continueCard, nextWeek);
    } else {
        showCompletionMessage(continueCard);
    }
} 