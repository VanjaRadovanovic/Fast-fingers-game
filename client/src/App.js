import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import ChooseName from './components/chooseName/chooseName';
import RoomSelection from './components/roomSelection/RoomSelection';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import CreateRoom from './components/createRoom/CreateRoom';
import JoiningRoom from './components/joiningRoom/JoiningRoom';
import GameRoom from './components/gameRoom/GameRoom';
import GameScoreBoard from './components/gameScoreBoard/gameScoreBoard';

let socket;

function App() {
    const [name, setName] = useState('');
    const [roomsData, setRoomData] = useState([]);
    const [playerProgressData, setPlayerProgressData] = useState({});
    const [playerFinishedData, setPlayerFinishedData] = useState({});
    const [gameFinishedData, setGameFinishedData] = useState({ finished: false });

    useEffect(() => {
        socket = io('http://localhost:4001', { forceNew: true });
        socket.on('rooms-data', (data) => {
            setRoomData(data);
        });
        socket.on('new-room-created', (data) => {
            setRoomData(data);
        });

        socket.on('player-progress', (data) => {
            setPlayerProgressData(data);
        });

        socket.on('player-finished', (data) => {
            setPlayerFinishedData(data);
        });

        socket.on('game-finished', (data) => {
            setGameFinishedData({ finished: true, data: data });
        });

        return socket;
    }, []);

    const onSubmitName = (e, name, history) => {
        e.preventDefault();
        if (name.length === 0) return;
        history.push('/choose-room');
        setName(name);
    };

    return (
        <div className='outher-container'>
            <div className='game-selection-container'>
                <Router>
                    <Switch>
                        <Route exact path='/'>
                            <Redirect to='/choose-name' />
                        </Route>
                        <Route path='/choose-name'>
                            <ChooseName onSubmitName={onSubmitName} />
                        </Route>
                        <Route
                            path='/choose-room'
                            render={() =>
                                name.length === 0 ? <Redirect to='/choose-name' /> : <RoomSelection socket={socket} data={roomsData} myName={name} />
                            }
                        />
                        <Route
                            path='/create-room'
                            render={() => (name.length === 0 ? <Redirect to='/choose-name' /> : <CreateRoom socket={socket} hostName={name} />)}
                        />
                        <Route
                            path='/room/:id/joining'
                            render={() => (name.length === 0 ? <Redirect to='/choose-name' /> : <JoiningRoom socket={socket} />)}
                        />
                        <Route
                            path='/room/:id/game'
                            render={() =>
                                name.length === 0 ? (
                                    <Redirect to='/choose-name' />
                                ) : (
                                    <GameRoom
                                        socket={socket}
                                        playerProgressData={playerProgressData}
                                        playerFinishedData={playerFinishedData}
                                        gameFinishedData={gameFinishedData}
                                    />
                                )
                            }
                        />
                        <Route
                            path='/room/:id/mid-game-scoreboard'
                            render={() =>
                                name.length === 0 ? (
                                    <Redirect to='/choose-name' />
                                ) : (
                                    <GameScoreBoard gameFinishedData={gameFinishedData} socket={socket} setGameFinishedData={setGameFinishedData} />
                                )
                            }
                        />
                    </Switch>
                </Router>
            </div>
        </div>
    );
}

export default App;
