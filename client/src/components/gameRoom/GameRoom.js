import React, { useEffect, useState, useRef } from 'react';
import './GameRoom.css';
import useCountDown from 'react-countdown-hook';
import { useHistory } from 'react-router-dom';

const GameRoom = ({ socket, playerProgressData, playerFinishedData, gameFinishedData }) => {
    const [gameData, setGameData] = useState({ players: [], text: [] });
    const [input, setInput] = useState('');
    const [textStyles, setTextStyles] = useState([]);
    const [wordCounter, setWordCounter] = useState(0);
    const [letterCounter, setLetterCounter] = useState({ right: 0, total: 0 });
    const [wordsCount, setWordsCount] = useState([]);
    const [rowOffset, setRowOffset] = useState({ transform: 'translateY(0)' });
    const [offsetCounter, setOffsetCounter] = useState(-42);
    const [counterForWordsCounter, setCounterForWordsCounter] = useState(0);
    const wordsRef = useRef([]);
    const [timer, setTimer] = useState({ minutes: 4, display: '' });
    const [textBlur, setTextBlur] = useState('text-blur');
    const [secondsTimer, secondsTimerOptions] = useCountDown(59000);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const history = useHistory();

    socket.on('game-data', (data) => {
        setGameData(data);
        setTimeout(() => {
            resetSetting(data);
        }, 3000);
    });

    const resetSetting = (newData) => {
        setIsGameStarted(true);
        setTextBlur('');
        secondsTimerOptions.start();
        setRowOffset({ transform: 'translateY(0)' });
        setInput('');
        setTextStyles(
            newData.text.map((val, i) => {
                if (i === 0) {
                    return 'selected-word';
                }
                return 'nonselected-word';
            })
        );
        setWordCounter(0);
        setOffsetCounter(-42);
    };

    useEffect(() => {
        if (isGameStarted) {
            let newTimerSettings;
            if (secondsTimer === 0) {
                setTimeout(() => {
                    secondsTimerOptions.reset();
                    if (textBlur === 'text-blur') {
                        secondsTimerOptions.start();
                    }
                }, 1000);
                newTimerSettings = { minutes: timer.minutes - 1, display: `${timer.minutes}:0${secondsTimer.toString().slice(0, 2)}` };
            } else if (secondsTimer < 10000) {
                newTimerSettings = { ...timer, display: `${timer.minutes}:0${secondsTimer.toString()[0]}` };
            } else {
                newTimerSettings = { ...timer, display: `${timer.minutes}:${secondsTimer.toString().slice(0, 2)}` };
            }
            if (newTimerSettings.minutes === 0 && secondsTimer === 0) {
                gameOver();
            }
            setTimer(newTimerSettings);
            let playerData = {
                data: {
                    ...gameData.players.filter((val) => val.id === socket.id)[0],
                    wpm: calcWPM(),
                },
                room: gameData.id,
            };
            socket.emit('player-progress-changed', playerData);
        }
    }, [secondsTimer]);

    const gameOver = () => {
        secondsTimerOptions.reset();
        history.push(`/room/${gameData.id}/mid-game-scoreboard`);
    };

    const calcWPM = () => {
        let totalTimeCount = (5 - (timer.minutes + 1)) * 60 + (60 - secondsTimer / 1000);
        return Math.round((letterCounter.right / 5) * (60 / totalTimeCount));
    };

    useEffect(() => {
        setTextStyles(
            gameData.text.map((val, i) => {
                if (i === 0) {
                    return 'selected-word';
                }
                return 'nonselected-word';
            })
        );
        wordsRef.current = new Array(gameData.text.length);
        let totalLetterCounter = 0;
        gameData.text.forEach((val) => {
            totalLetterCounter += val.length;
        });
        setLetterCounter({ ...letterCounter, total: totalLetterCounter });
    }, [gameData.text]);

    useEffect(() => {
        let rowCount = 0;
        let rowWordCounter = [];
        wordsRef.current.forEach((val, i) => {
            if (i === 0) {
                rowWordCounter = [-20];
                return;
            }
            if (val.offsetTop !== wordsRef.current[i - 1].offsetTop || i === wordsRef.current.length - 1) {
                if (i === wordsRef.current.length - 1) {
                    rowWordCounter.shift();
                }
                rowCount++;
                rowWordCounter = [...rowWordCounter, rowCount];
            } else {
                rowCount++;
            }
        });
        setWordsCount(rowWordCounter);
    }, [wordsRef.current]);

    const inputOnChange = (e) => {
        if (!isGameStarted) {
            setInput('');
        } else if (e.target.value[e.target.value.length - 1] === ' ') {
            nextWord(e);
        } else {
            wordCheck(e);
        }
    };

    const wordCheck = (e) => {
        setInput(e.target.value);
        setTextStyles(
            textStyles.map((val, i) => {
                if (i === wordCounter) {
                    if (e.target.value !== gameData.text[wordCounter].slice(0, e.target.value.length)) {
                        return 'wrong-word-selected';
                    } else {
                        return 'selected-word';
                    }
                }
                return val;
            })
        );
    };

    const nextWord = (e) => {
        let newTextStyles;
        if (e.target.value === gameData.text[wordCounter] + ' ') {
            newTextStyles = textStyles.map((val, i) => {
                if (wordCounter === i) {
                    return 'word-right';
                }
                return val;
            });
            dataCalculation(gameData.text[wordCounter].length);
        } else {
            newTextStyles = textStyles.map((val, i) => {
                if (wordCounter === i) {
                    return 'selected-word';
                }
                return val;
            });
            setInput('');
            setTextStyles(newTextStyles);
            return;
        }
        newTextStyles = newTextStyles.map((val, i) => {
            if (wordCounter + 1 === wordsCount[counterForWordsCounter] && counterForWordsCounter !== wordsCount.length - 1) {
                setRowOffset({ transform: `translateY(${offsetCounter}px)` });
                setOffsetCounter(offsetCounter - 42);
                setCounterForWordsCounter(counterForWordsCounter + 1);
            }
            if (wordCounter + 1 === i) {
                return 'selected-word';
            }
            return val;
        });
        setWordCounter(wordCounter + 1);
        setTextStyles(newTextStyles);
        setInput('');
        if (gameData.text.length === wordCounter + 1) {
            secondsTimerOptions.pause();
            console.log('wpm count', Math.round((letterCounter.total / 5) * (60 / ((5 - (timer.minutes + 1)) * 60 + (60 - secondsTimer / 1000)))))
            socket.emit('finished', { room: gameData.id, player: { ...gameData.players.filter((val) => val.id === socket.id)[0], wpm: Math.round((letterCounter.total / 5) * (60 / ((5 - (timer.minutes + 1)) * 60 + (60 - secondsTimer / 1000)))) } });
        }
    };

    const dataCalculation = async (additionalWord) => {
        let rightWords = letterCounter.right + additionalWord;
        setLetterCounter({ ...letterCounter, right: rightWords });
        let playerData = {
            data: {
                ...gameData.players.filter((val) => val.id === socket.id)[0],
                progress: Math.floor(((rightWords / letterCounter.total) * 100) / 5) * 5,
            },
            room: gameData.id,
        };
        socket.emit('player-progress-changed', playerData);
    };

    useEffect(() => {
        setGameData({
            ...gameData,
            players: gameData.players.map((val) => {
                if (val.id === playerProgressData.id) {
                    return playerProgressData;
                } else {
                    return val;
                }
            }),
        });
    }, [playerProgressData]);

    socket.on('player-left-in-game', (data) => {
        setGameData({ ...gameData, players: gameData.players.filter((val) => val.id !== data) });
    });

    useEffect(() => {
        if (playerFinishedData.id === undefined) return;
        setGameData({
            ...gameData,
            players: gameData.players.map((val) => {
                if (val.id === playerFinishedData.id) {
                    return playerFinishedData;
                }
                return val;
            }),
        });
    }, [playerFinishedData]);

    useEffect(() => {
        if (gameFinishedData.finished !== true) return;
        secondsTimerOptions.pause();
        history.push(`/room/${gameData.id}/mid-game-scoreboard`);
    }, [gameFinishedData.finished]);

    return (
        <div>
            <div className='game-room-heading'>
                <h1 className='create-room-title'>{gameData.room}</h1>
                <h1>{timer.display || '5:00'}</h1>
            </div>
            {gameData.players.map((val, i) => (
                <div key={i} className='player-container'>
                    <h2 style={{ textAlign: 'start' }} className='player-name'>
                        {val.id === socket.id ? `${val.name} (me)` : val.name}
                    </h2>
                    <div className='player-progress'>
                        <div style={{ transform: `translateX(-${100 - val.progress}%)` }}></div>
                    </div>
                    <h3 className='player-wpm'>{val.wpm} WPM</h3>
                    <h3>{val.currentGamePlace}</h3>
                </div>
            ))}
            <div className='game-text'>
                {gameData.text.map((val, i) => {
                    return (
                        <h2 key={i} style={rowOffset} ref={(ref) => (wordsRef.current[i] = ref)} className={`${textStyles[i]} ${textBlur}`}>
                            {val}
                        </h2>
                    );
                })}
            </div>
            <input className='game-input' type='text' value={input} onChange={inputOnChange} />
        </div>
    );
};

export default GameRoom;
