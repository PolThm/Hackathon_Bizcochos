const routinesData = [
    {
        "id": "example",
        "name": "Routine di Esempio",
        "breakDuration": 5,
        "preparationDuration": 5,
        "exercises": [
            {
                "id": 1,
                "name": "Stretching",
                "duration": 30,
                "isPaused": false
            },
            {
                "id": 2,
                "name": "Push-ups",
                "duration": 45
            }
        ]
    },
    {
        "id": "basic",
        "name": "Basic Routine",
        "breakDuration": 10,
        "preparationDuration": 5,
        "exercises": [
            {
                "id": 101,
                "name": "Plank",
                "duration": 60
            }
        ]
    }
];

export const getRoutines = () => {
    return routinesData;
};
