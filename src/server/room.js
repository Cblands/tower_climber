class Room {
    roomNum;
    playersInRoom = {};

    constructor(roomNumber) {
        this.roomNum = roomNumber;
    }

    addPlayerToRoom(socket) {
        console.log('User ' + socket.id + ' joined');
        socket.join("room-" + this.roomNum);

        this.playersInRoom[socket.id] = {
            rotation: 0,
            x: Math.floor(Object.keys(this.playersInRoom).length * 235) + 115,
            y: 1260,
            playerId: socket.id,
            roomNum: this.roomNum
        };

        socket.emit('currentPlayers', this.playersInRoom);
        socket.broadcast.to('room-' + this.roomNum).emit('newPlayer', this.playersInRoom[socket.id]);
    }

    removePlayerFromRoom(socket) {
        console.log('User ' + socket.id + ' left');
        socket.leave('room-' + this.roomNum);
        delete this.playersInRoom[socket.id];
        socket.to("room-" + this.roomNum).emit('disconnectPlayer', socket.id);
    }

    updatePlayerMovement(socket, moveData) {
        this.playersInRoom[socket.id].x = moveData.x;
        this.playersInRoom[socket.id].y = moveData.y;
        socket.broadcast.to('room-' + this.roomNum).emit('playerMoved', this.playersInRoom[socket.id]);
    }

    checkIfPlayerInRoom(socketId) {
        return socketId in this.playersInRoom;
    }

    getPlayersInRoom() {
        return this.playersInRoom;
    }

    getNumOfPlayers() {
        return Object.keys(this.playersInRoom).length;
    }
}

module.exports = Room;
