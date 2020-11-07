import React, { useState } from 'react';
import './CreateRoom.css';
import { Link, useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const CreateRoom = ({ socket, hostName }) => {
    const [roomName, setRoomName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(6);
    const [rounds, setRounds] = useState(5);
    const history = useHistory();

    const onSubmit = (e) => {
        e.preventDefault();
        if (roomName.length === 0) return;
        let data = {
            players: [{ name: hostName, id: socket.id }],
            room: roomName,
            maxPlayers,
            numOfRounds: rounds,
            id: uuidv4(),
            host: socket.id,
        };
        socket.emit('game-create', data);
        console.log(socket.id);
        history.push(`/room/${data.id}/joining`);
    };

    return (
        <div>
            <div className='create-room-heading'>
                <Link to='/choose-room' className='button-style'>
                    {'<'}
                </Link>
                <h1 className='create-room-title'>Create Room</h1>
            </div>
            <form className='create-room-form' onSubmit={onSubmit}>
                <label>Room Name</label>
                <input
                    type='text'
                    placeholder='Room 1'
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                />
                <label>Max number of players</label>
                <div className='max-players'>
                    <button
                        type='button'
                        className='left-button button-style create-room-buttons'
                        onClick={(e) => (maxPlayers > 2 ? setMaxPlayers(maxPlayers - 1) : null)}>
                        -
                    </button>
                    <div>{maxPlayers}</div>
                    <button
                        type='button'
                        className='right-button button-style create-room-buttons'
                        onClick={(e) => (maxPlayers < 6 ? setMaxPlayers(maxPlayers + 1) : null)}>
                        +
                    </button>
                </div>
                <label>Number of rounds</label>
                <div className='number-of-rounds'>
                    <button
                        type='button'
                        className='left-button button-style create-room-buttons'
                        onClick={(e) => (rounds > 1 ? setRounds(rounds - 1) : null)}>
                        -
                    </button>
                    <div>{rounds}</div>
                    <button
                        type='button'
                        className='right-button button-style create-room-buttons'
                        onClick={(e) => (rounds < 10 ? setRounds(rounds + 1) : null)}>
                        +
                    </button>
                </div>
                <button type='submit' className='button-style'>
                    Create
                </button>
            </form>
        </div>
    );
};

export default CreateRoom;
