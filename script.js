document.addEventListener('DOMContentLoaded', () => {
    // Add completed weeks tracking
    const COMPLETED_WEEKS_KEY = 'completedWorkoutWeeks';
    let completedWeeks = new Set(JSON.parse(localStorage.getItem(COMPLETED_WEEKS_KEY) || '[]'));

    // Add workout states tracking
    const WORKOUT_STATES_KEY = 'workoutDropdownStates';
    const workoutStates = JSON.parse(localStorage.getItem(WORKOUT_STATES_KEY) || '{}');

    // Add this at the top level of your script
    const activeTimers = new Map(); // Store active timer IDs

    function saveCompletedWeeks() {
        localStorage.setItem(COMPLETED_WEEKS_KEY, JSON.stringify([...completedWeeks]));
    }

    function saveWorkoutStates() {
        localStorage.setItem(WORKOUT_STATES_KEY, JSON.stringify(workoutStates));
    }

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

    function parseWorkoutCSV(csvText) {
        const lines = csvText.split('\n').map(line => line.split(','));
        const workouts = {};
        let currentWeek = '';
        let currentType = '';

        for (const line of lines) {
            // Clean up the line values
            const cleanLine = line.map(cell => cell?.trim() || '');
            
            // Check for week header
            if (cleanLine[1]?.startsWith('Week')) {
                currentWeek = cleanLine[1];
                workouts[currentWeek] = {};
                continue;
            }

            // Check for workout type
            if (['Full Body', 'Upper', 'Lower'].includes(cleanLine[1])) {
                currentType = cleanLine[1];
                workouts[currentWeek][currentType] = [];
                
                // If there's an exercise on the same line as the workout type
                if (cleanLine[2] && cleanLine[2] !== 'Exercise') {
                    workouts[currentWeek][currentType].push({
                        exercise: cleanLine[2],
                        warmUpSets: cleanLine[3],
                        workingSets: cleanLine[4],
                        reps: cleanLine[5],
                        load: cleanLine[6],
                        rpe: cleanLine[7],
                        rest: cleanLine[8],
                        sub1: cleanLine[9],
                        sub2: cleanLine[10],
                        notes: cleanLine[11]
                    });
                }
                continue;
            }

            // Add exercise if we have a current week and type
            if (currentWeek && currentType && cleanLine[2] && cleanLine[2] !== 'Exercise') {
                workouts[currentWeek][currentType].push({
                    exercise: cleanLine[2],
                    warmUpSets: cleanLine[3],
                    workingSets: cleanLine[4],
                    reps: cleanLine[5],
                    load: cleanLine[6],
                    rpe: cleanLine[7],
                    rest: cleanLine[8],
                    sub1: cleanLine[9],
                    sub2: cleanLine[10],
                    notes: cleanLine[11]
                });
            }
        }
        
        return workouts;
    }

    function findNextUncompletedWeek(workoutData) {
        return Object.keys(workoutData).find(week => !completedWeeks.has(week));
    }

    function displayWeeksGrid(workoutData) {
        const workoutList = document.getElementById('workout-list');
        workoutList.innerHTML = '';
        
        const weeksGrid = document.createElement('div');
        weeksGrid.className = 'weeks-grid';

        const nextWeek = findNextUncompletedWeek(workoutData);
        if (nextWeek) {
            const continueCard = createContinueCard(nextWeek, workoutData[nextWeek]);
            weeksGrid.appendChild(continueCard);
        }

        for (const [week, workouts] of Object.entries(workoutData)) {
            const weekCard = createWeekCard(week, workouts);
            weeksGrid.appendChild(weekCard);
        }

        workoutList.appendChild(weeksGrid);
    }

    function createWeekCard(week, workouts) {
        const card = document.createElement('div');
        card.className = 'week-card';
        card.dataset.week = week;
        if (completedWeeks.has(week)) {
            card.classList.add('completed');
        }
        
        // Count total exercises for the week
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

        // Create the detailed view container
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

        // Add click handlers for the complete buttons
        const completeButton = card.querySelector('.complete-button');
        completeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card from opening
            toggleWeekCompletion(week, card, weekDetails);
        });

        const completeButtonLarge = weekDetails.querySelector('.complete-button-large');
        completeButtonLarge.addEventListener('click', () => {
            toggleWeekCompletion(week, card, weekDetails);
        });

        // Add click handlers for the modal
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

        document.body.appendChild(weekDetails);
        return card;
    }

    function toggleWeekCompletion(week, card, weekDetails) {
        const isCompleted = completedWeeks.has(week);
        const cardButton = card.querySelector('.complete-button');
        const modalButton = weekDetails.querySelector('.complete-button-large');
        
        if (isCompleted) {
            completedWeeks.delete(week);
            card.classList.remove('completed');
            cardButton.classList.remove('completed');
            modalButton.classList.remove('completed');
            cardButton.textContent = 'Mark Complete';
            modalButton.textContent = 'Mark Week as Complete';
        } else {
            completedWeeks.add(week);
            card.classList.add('completed');
            cardButton.classList.add('completed');
            modalButton.classList.add('completed');
            cardButton.textContent = 'Completed ✓';
            modalButton.textContent = 'Completed ✓';
        }
        
        saveCompletedWeeks();
        updateContinueCard();
    }

    function updateContinueCard() {
        const continueCard = document.querySelector('.continue-card');
        if (!continueCard) return;

        const allWeekCards = Array.from(document.querySelectorAll('.week-card:not(.continue-card)'));
        const nextWeek = allWeekCards.find(card => !card.classList.contains('completed'));

        if (nextWeek) {
            // Update continue card content
            const weekData = {
                week: nextWeek.querySelector('h2').textContent,
                workouts: nextWeek.querySelector('.week-summary').children[0].textContent,
                exercises: nextWeek.querySelector('.week-summary').children[1].textContent
            };

            continueCard.innerHTML = `
                <h2>Continue Workout</h2>
                <div class="week-summary">
                    <p>Next: ${weekData.week}</p>
                    <p>${weekData.workouts}</p>
                    <p>${weekData.exercises}</p>
                </div>
                <div class="continue-icon">▶</div>
            `;

            // Update click handler
            const existingDetails = document.querySelector(`.week-details[data-week="${weekData.week}"]`);
            continueCard.onclick = () => {
                existingDetails.classList.add('active');
                document.body.style.overflow = 'hidden';
            };
        } else {
            // All weeks completed
            continueCard.innerHTML = `
                <h2>All Complete!</h2>
                <div class="week-summary">
                    <p>Congratulations!</p>
                    <p>You've completed all weeks</p>
                </div>
                <div class="continue-icon">🎉</div>
            `;
        }
    }

    function createWeekContent(workouts) {
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

    function parseRestTime(restString) {
        const match = restString.match(/~?(\d+(?:\.\d+)?)\s*min/);
        return match ? Number.parseFloat(match[1]) * 60 : 90; // default to 90 seconds if parsing fails
    }

    function createExerciseCardHTML(exercise) {
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

    function createContinueCard(nextWeek, workouts) {
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

        // Create the detailed view container for the next week
        const weekDetails = document.createElement('div');
        weekDetails.className = 'week-details';
        weekDetails.dataset.week = nextWeek;
        weekDetails.innerHTML = `
            <div class="week-content">
                <button class="close-button">×</button>
                <h2>${nextWeek}</h2>
                <button class="complete-button-large">Mark Week as Complete</button>
                ${createWeekContent(workouts)}
            </div>
        `;

        // Add click handlers
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

        const completeButtonLarge = weekDetails.querySelector('.complete-button-large');
        completeButtonLarge.addEventListener('click', () => {
            const weekCard = document.querySelector(`.week-card[data-week="${nextWeek}"]`);
            toggleWeekCompletion(nextWeek, weekCard, weekDetails);
            // Refresh the grid to update the continue card
            loadWorkout();
        });

        document.body.appendChild(weekDetails);
        return card;
    }

    function startTimer(timerButton, seconds) {
        const timerId = activeTimers.get(timerButton);
        const timerDisplay = timerButton.nextElementSibling;
        
        // If timer is already running, stop and reset it
        if (timerId) {
            clearInterval(timerId);
            activeTimers.delete(timerButton);
            timerButton.disabled = false;
            timerButton.classList.remove('running');
            timerDisplay.textContent = '';
            return;
        }

        // Start new timer
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
                new Audio('data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=').play();
        }
    }, 1000);

    activeTimers.set(timerButton, newTimerId);
    updateDisplay();
}

    // Add event listeners
    document.addEventListener('click', (e) => {
        // Handle exercise card toggles
        const exerciseHeader = e.target.closest('.exercise-header');
        if (exerciseHeader) {
            const exerciseCard = exerciseHeader.closest('.exercise-card');
            if (exerciseCard) {
                exerciseCard.classList.toggle('active');
            }
        }

        // Handle workout type toggles
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

        // Timer button click handler
        if (e.target.classList.contains('timer-button')) {
            const restTime = Number.parseInt(e.target.dataset.restTime, 10);
            startTimer(e.target, restTime);
        }
    });

    loadWorkout();
}); 