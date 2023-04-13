import React, {FC, useEffect, useState} from 'react';
import {storage} from "./firebase";
import {ref, getDownloadURL, listAll} from "firebase/storage";
import {ITrack} from "./interfaces";
import {UPLOAD_NEW_TUNE} from "./consts";
import {BsBootstrapReboot, BsFillVolumeMuteFill, BsFillVolumeUpFill} from "react-icons/bs";


let audio: HTMLAudioElement;

// todo: redux
// todo: нормальные тайтлы, громкость и duration


const App: FC = () => {
    const [tracks, setTracks] = useState<ITrack[]>([]);
    const [currentTrackUrl, setCurrentTrackUrl] = useState('');
    const [currentTrackTitle, setCurrentTrackTitle] = useState('');
    const [currentlyPlaying, setCurrentlyPlaying] = useState(false);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [timeToAlarm, setTimeToAlarm] = useState(-1);

    const nameTransformer = (url = '') => {
        if (url) {
            return url.split('%2F')[1].split('?')[0];
        }
        return '';
    };

    useEffect(() => {
        if (timeToAlarm > 0) {
            const interval = setInterval(() => {
                setTimeToAlarm(prev => prev - 1);
                clearInterval(interval);
            }, 1000);
        } else if (!timeToAlarm) {
            if (!audio) {
                audio = new Audio();
            }
            playTrack().then().catch().finally();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeToAlarm, currentTrackUrl]);

    const fetchUrls = () => {
        const listRef = ref(storage, '/audio');
        const downloadURLs: Promise<string>[] = [];

        listAll(listRef)
            .then(async (res) => {
                res.items.forEach(async itemRef => downloadURLs.push(getDownloadURL(itemRef)));
                const downloadURLsResult = await Promise.all(downloadURLs);
                downloadURLsResult.push('');
                const data = downloadURLsResult.map(el => {
                    return {
                        url: el || UPLOAD_NEW_TUNE,
                        title: nameTransformer(el) || UPLOAD_NEW_TUNE,
                        disabled: !el
                    }
                });
                setTracks(data);
                setCurrentTrackUrl(data[0].url);
                setCurrentTrackTitle(nameTransformer(data[0].url));
            });
    };

    const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentTrackUrl(e.target.value);
        setCurrentTrackTitle(nameTransformer(e.target.value));
        setTimeToAlarm(-1);
    };

    useEffect(() => {
        fetchUrls();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const playTrack = async () => {
        audio.src = currentTrackUrl;
        audio.onended = () => setCurrentlyPlaying(false);
        await audio.play();
        setCurrentlyPlaying(true);
    };

    const pauseTrack = () => {
        if (audio) {
            audio.pause();
        }
        setCurrentlyPlaying(false);
    };

    const handleTimeClear = () => {
        setTimeToAlarm(-1);
        setMinutes(0);
        setSeconds(0);
    };

    return (
        <div className="wrapper">

            <p>Будильник. Можно установить мелодию, и в назначенный час она прозвучит там, где вы его оставили.</p><br/>

            <label><b>Текущая мелодия:</b> {currentTrackTitle}</label>
            <select onChange={e => handleTrackChange(e)}>
                {tracks.map(el => {
                    return <option key={el.url} value={el.url} disabled={el.disabled}>{el.title}</option>
                })}
            </select>

            <label><b>Установить время:</b></label>
            <div className='section'>
                <div>
                    <span>mm:</span>
                    <input type={'number'} min={0} max={10} value={minutes} onChange={e => setMinutes(+e.target.value)}/>
                </div>
                <div>
                    <span>ss:</span>
                    <input type={'number'} placeholder={'mm'} min={0} max={59} value={seconds}
                           onChange={e => setSeconds(+e.target.value)}/>
                </div>


                <div className='buttons'>
                    {timeToAlarm > 0 &&
                    <label>Время до запуска: {
                        [parseInt(timeToAlarm / 60+'').toString(), parseInt(timeToAlarm % 60 + '').toString()]
                            .map(el => el.length < 2 ? `0${el}` : el).join(':')}
                    </label>}
                    <BsFillVolumeUpFill title={'set'}
                                        className={currentlyPlaying ? 'active' : !minutes && !seconds ? 'disabled' : timeToAlarm > 0 ? 'inactive' : ''}
                                        onClick={() => setTimeToAlarm(minutes * 60 + seconds)}/>
                    <BsFillVolumeMuteFill title={'stop'} onClick={pauseTrack} className={!currentlyPlaying ? 'disabled' : ''}/>
                    <BsBootstrapReboot title={'reset timer'} onClick={handleTimeClear}/>
                </div>
            </div>

        </div>
    );
};

export default App;
