// CSV parsing functions
export function parseWorkoutCSV(csvText) {
    const lines = csvText.split('\n').map(line => line.split(','));
    const workouts = {};
    let currentWeek = '';
    let currentType = '';

    for (const line of lines) {
        const cleanLine = line.map(cell => cell?.trim() || '');
        
        if (cleanLine[1]?.startsWith('Week')) {
            currentWeek = cleanLine[1];
            workouts[currentWeek] = {};
            continue;
        }

        if (['Full Body', 'Upper', 'Lower'].includes(cleanLine[1])) {
            currentType = cleanLine[1];
            workouts[currentWeek][currentType] = [];
            
            if (cleanLine[2] && cleanLine[2] !== 'Exercise') {
                workouts[currentWeek][currentType].push(createExerciseObject(cleanLine));
            }
            continue;
        }

        if (currentWeek && currentType && cleanLine[2] && cleanLine[2] !== 'Exercise') {
            workouts[currentWeek][currentType].push(createExerciseObject(cleanLine));
        }
    }
    
    return workouts;
}

function createExerciseObject(cleanLine) {
    return {
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
    };
}

export function parseRestTime(restString) {
    const match = restString.match(/~?(\d+(?:\.\d+)?)\s*min/);
    return match ? Number.parseFloat(match[1]) * 60 : 90;
} 