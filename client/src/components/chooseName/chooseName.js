import React, { useState } from 'react';
import './chooseName.css';
import { useHistory } from 'react-router-dom';

const ChooseName = ({ onSubmitName }) => {

    const [name, setName] = useState('');
    const history = useHistory();

    return (
        <div className="choose-room-container">
            <h1>Choose name</h1>
            <form onSubmit={e => onSubmitName(e, name, history)}>
                <input autoFocus placeholder="Name" type="text" value={name} onChange={e => setName(e.target.value)}/>
                <button className="button-style" to="choose-room">Join</button>
            </form>
        </div>
    )
}

export default ChooseName
