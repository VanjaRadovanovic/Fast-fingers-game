const { text } = require('express');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

//Port from environment variable or default - 4001
const port = process.env.PORT || 4001;

//Setting up express and adding socketIo middleware
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const textGen = require('txtgen');
let rooms = [];

io.on('connect', (socket) => {
    console.log('Player has connected');
    socket.emit('rooms-data', rooms);

    socket.on('game-create', (data) => {
        socket.join(data.id);
        rooms = [...rooms, data];
        socket.join(socket.id);
        io.emit('new-room-created', rooms);
        socket.emit('game-joining-data', data);
    });

    socket.on('room-started', (data) => {
        io.emit(
            'rooms-data',
            rooms.filter((val) => val.id !== data)
        );
    });

    socket.on('joining-room', (data) => {
        socket.join(data.roomId);
        rooms = rooms.map((val) => {
            if (val.id === data.roomId) {
                let roomData = {
                    ...val,
                    players: [...val.players, { name: data.myName, id: socket.id }],
                };
                socket.emit('game-joining-data', roomData);
                socket.to(data.roomId).emit('player-joined', roomData);
                return roomData;
            }
            return val;
        });
        io.emit('new-room-created', rooms);
    });

    socket.on('leaving-room', ({ socketId, room }) => {
        rooms = rooms.map((room) => {
            if (room.host === socketId) {
                if (room.players.length === 1) {
                    return 'empty';
                }
                return {
                    ...room,
                    host: room.players[1].id,
                    players: room.players.filter((val) => val.id !== socketId),
                };
            }
            return { ...room, players: room.players.filter((val) => val.id !== socketId) };
        });
        rooms = rooms.filter((val) => val !== 'empty');
        io.emit('new-room-created', rooms);
        rooms.forEach((val) => {
            if (val.id === room) {
                socket.to(room).emit('player-left', val);
            }
        });
    });

    socket.on('start-game', (data) => {
        io.to(data.id).emit('game-redirect');
        rooms = rooms.map((val) => {
            if (val.id === data.id) {
                let newDataStructure = {
                    ...data,
                    text: textGen.paragraph().split(' '),
                    nextPlace: 1,
                    gameCounter: val.gameCounter + 1 || 1,
                    players: data.players.map((val) => {
                        return {
                            ...val,
                            progress: 0,
                            totalPoints: val.totalPoints || 0,
                            totalPlace: val.totalPlace || 1,
                            currentGamePlace: 0,
                            totalAvgWPM: val.totalAvgWPM || 0,
                            wpm: 0,
                        };
                    }),
                };
                if (newDataStructure.text.length > 2) {
                    newDataStructure.text = newDataStructure.text.filter((val, i) => i < 2);
                }
                io.to(data.id).emit('game-data', newDataStructure);
                return newDataStructure;
            }
            return val;
        });
    });

    socket.on('player-progress-changed', (data) => {
        rooms = rooms.map((val) => {
            if (val.id === data.room) {
                return {
                    ...val,
                    players: val.players.map((player) => {
                        if (player.id === data.data.id) {
                            return data.data;
                        }
                        return player;
                    }),
                };
            }
            return val;
        });
        io.to(data.room).emit('player-progress', data.data);
    });

    socket.on('finished', (playerData) => {
        rooms = rooms.map((val) => {
            if (val.id === playerData.room) {
                playerData.player.currentGamePlace = val.nextPlace;
                playerData.player.progress = 100;
                if (val.gameCounter === 1) {
                    playerData.player.totalAvgWPM = playerData.player.wpm;
                } else {
                    playerData.player.totalAvgWPM = Math.round((playerData.player.totalAvgWPM + playerData.player.wpm) / 2);
                }
                console.log(playerData.player.totalPoints);
                playerData.player.totalPoints += val.players.length - playerData.player.currentGamePlace;
                playerData.player.totalPlace = totalPlaceCount(val.players, playerData.player);
                console.log(playerData.player, 'total place count');
                io.to(playerData.room).emit('player-finished', playerData.player);
                let newPlayersData = val.players.map((player, i, arr) => {
                    if (player.id === playerData.player.id) {
                        return playerData.player;
                    }
                    if (arr.length === val.nextPlace + 1 && player.progress !== 100) {
                        return {
                            ...player,
                            currentGamePlace: arr.length,
                            totalAvgWPM: Math.round((player.totalAvgWPM + player.wpm) / 2),
                            totalPlace: totalPlaceCount(val.players, playerData.player),
                        };
                    }
                    return player;
                });
                if (val.players.length === val.nextPlace + 1 || val.players.length === val.nextPlace) {
                    io.to(playerData.room).emit('game-finished', { ...val, players: newPlayersData });
                }
                return { ...val, nextPlace: val.nextPlace + 1, players: newPlayersData };
            }
            return val;
        });
    });

    const totalPlaceCount = (allPlayers, thisPlayer) => {
        let totalPlace = 1;
        allPlayers.forEach((val) => {
            if (val.id !== thisPlayer.id && val.totalPoints > thisPlayer.totalPoints) {
                totalPlace++;
            }
        });
        return totalPlace;
    };

    socket.on('disconnect', () => {
        rooms = rooms.map((room) => {
            if (room.host === socket.id) {
                if (room.players.length === 1) {
                    return 'empty';
                }
                return {
                    ...room,
                    host: room.players[1].id,
                    players: room.players.filter((val) => val.id !== socket.id),
                };
            }
            room.players.forEach((val) => {
                if (val.id === socket.id) {
                    socket.to(room.id).emit('player-left-in-game', val.id);
                }
            });
            return { ...room, players: room.players.filter((val) => val.id !== socket.id) };
        });
        rooms = rooms.filter((val) => val !== 'empty');
        io.emit('new-room-created', rooms);
        rooms.forEach((val) => {
            socket.to(val.id).emit('player-left', val);
        });
    });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
