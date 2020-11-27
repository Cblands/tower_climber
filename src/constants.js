module.exports = {
    roomStates: {
        waiting: 0, // Before room has reached capacity
        ready: 1, // Short amount of time between a room becoming full and the countdown starting
        countdown: 2, // Countdown phase
        running: 3, // Active game
        end: 4, // Goal state has been reached
    },
    maxPlayers: 2, // Maximum number of players in a room
    countdownTime: 10, // seconds
    readyUpTime: 5, // seconds
    goalLocation: 0, // y coordinates of goal
}
