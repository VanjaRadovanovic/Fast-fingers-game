import React from 'react';
import './Room.css';
import { useHistory } from 'react-router-dom';

const Room = ({
    myName,
    socket,
    name,
    numOfRounds,
    capacity,
    capacityLeft,
    buttonDisplay,
    linkId,
}) => {
    const history = useHistory();
    const onJoin = (e) => {
        if (capacityLeft >= capacity) return;
        history.push(`/room/${linkId}/joining`);
        socket.emit('joining-room', { myName: myName, roomId: linkId, id: socket.id });
    };

    return (
        <div className='room-container'>
            <h3>{name}</h3>
            <h4>{numOfRounds}</h4>
            <h4>
                {capacityLeft}/{capacity}
            </h4>
            <button style={{ display: buttonDisplay }} className='button-style' onClick={onJoin}>
                Join
            </button>
        </div>
    );
};

export default Room;
