import React, { useState } from 'react';
import './JoiningRoom.css';
import { Link, useHistory } from 'react-router-dom';

const JoiningRoom = ({ socket }) => {
    const [roomData, setRoomData] = useState({ room: '', players: [] });
    const history = useHistory();

    socket.on('game-joining-data', (data) => {
        console.log(data, 'game joining data');
        setRoomData(data);
    });

    socket.on('player-joined', (data) => {
        setRoomData(data);
    });

    socket.on('player-left', (data) => {
        setRoomData(data);
    });

    socket.on('game-redirect', () => {
        socket.emit('room-started', roomData.id);
        history.push(`/room/${roomData.id}/game`);
    });

    const leavingOnClick = (e) => {
        socket.emit('leaving-room', { socketId: socket.id, room: roomData.id });
    };

    const onStart = (e) => {
        socket.emit('start-game', roomData);
    };

    return (
        <div>
            <div className='create-room-heading'>
                <Link to='/choose-room' className='button-style' onClick={leavingOnClick}>
                    {'<'}
                </Link>
                <h1 className='create-room-title'>{roomData.room}</h1>
            </div>
            {roomData.players.map((val) => (
                <div className='joining-player' key={val.id}>
                    {val.id === roomData.host ? <h3>{val.name} (host)</h3> : <h3>{val.name}</h3>}
                </div>
            ))}
            {socket.id === roomData.host ? (
                <button style={{ width: '100%' }} className='button-style' onClick={onStart}>
                    Start
                </button>
            ) : null}
        </div>
    );
};

export default JoiningRoom;
