import React, { useState, useEffect } from 'react';
import './gameScoreBoard.css';

const GameScoreBoard = ({ socket, gameFinishedData, setGameFinishedData }) => {
    const [gameData, setGameData] = useState({ players: [] });

    useEffect(() => {
        if (gameFinishedData.data.players.length !== 0) {
            setGameData(gameFinishedData.data);
            setGameFinishedData({ finished: false, data: { players: [] } });
        }
        console.log(gameFinishedData.data);
    }, [gameFinishedData]);

    useEffect(() => {
        if (gameData.maxPlayers && gameData.numOfRounds !== gameData.gameCounter) {
            console.log(gameData);
            setTimeout(() => {
                if (socket.id === gameData.host) {
                    socket.emit('start-game', gameData);
                }
            }, 7000);
        }
    }, [gameData]);

    return (
        <div>
            <div className='game-room-heading'>
                <h1 className='create-room-title'>{gameData.room} sad asd as</h1>
                <h3>Game {`${gameData.gameCounter}/${gameData.numOfRounds}`}</h3>
            </div>
            <div className='player-container scoreboard-container'>
                <h3 style={{ textAlign: 'start' }} className='player-name'>
                    Name
                </h3>
                <h4 className='player-wpm'>Avg WPM</h4>
                <h4>Points</h4>
                <h4>Total Rank</h4>
            </div>
            {gameData.players.map((val, i) => (
                <div key={i} className='player-container scoreboard-container'>
                    <h2 style={{ textAlign: 'start' }} className='player-name'>
                        {val.id === socket.id ? `${val.name} (me)` : val.name}
                    </h2>
                    <h3 className='player-wpm'>{val.totalAvgWPM} WPM</h3>
                    <h3>{val.totalPoints}</h3>
                    <h1>{val.totalPlace}</h1>
                </div>
            ))}
        </div>
    );
};

export default GameScoreBoard;
