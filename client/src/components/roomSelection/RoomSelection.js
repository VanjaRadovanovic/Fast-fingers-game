import React, { useEffect } from 'react';
import './RoomSelection.css';
import Room from '../room/Room';
import { Link } from 'react-router-dom';

const RoomSelection = ({ socket, data, myName }) => {
    return (
        <>
            <div className='game-selection-header'>
                <h1>Choose room</h1>
                <Link to='/create-room' className='button-style'>
                    New room
                </Link>
            </div>
            <Room buttonDisplay='none' name='Name' capacity='' capacityLeft='Players' numOfRounds='Rounds' />
            {data.map((val) => {
                return !val.gameCounter ? (
                    <Room
                        myName={myName}
                        socket={socket}
                        buttonDisplay='block'
                        key={val.id}
                        name={val.room}
                        capacity={val.maxPlayers}
                        capacityLeft={val.players.length}
                        numOfRounds={val.numOfRounds}
                        linkId={val.id}
                    />
                ) : null;
            })}
            {data.length === 0 ? <h2 style={{ textAlign: 'center', marginBottom: '0' }}>Currently there is no rooms</h2> : null}
        </>
    );
};

export default RoomSelection;
