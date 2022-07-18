import React, { useState, useEffect, useRef } from "react";
import { Button, Spinner } from 'react-bootstrap';
import MaterialIcon, {colorPalette} from 'material-icons-react';

const SDK_SOURCE = 'https://sdk.scdn.co/spotify-player.js';

export default function CustomPlayer(props){

    const [is_paused, setPaused] = useState(true);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState(undefined);
    const [newTrack, setNewTrack] = useState(false);
    const [currentPos, setCurrPos] = useState(0.0);
    const intervalId = useRef(undefined);
    const [nowPlaying, setNowPlaying] = useState({
        /* 
         * object: nowPlaying: An object defining the track currently playing in the browser
         * id - the Spotify id for the track currently playing
         * name - the name of the track currently playing (format: <name - artist>)
         * albumArt - album art for the track currently playing
         * uri - URI where track can be found in Spotify
         */
          id: '',
          name: 'Not Checked',
          albumArt: './sadface.png',
          uri: ''
      });
    const getCurrentInfo = props.getCurrentInfo;
    const setPauseAnimation = props.setPauseAnimation;

    useEffect(() => {
        const script = document.createElement("script");
        script.src = SDK_SOURCE;
        script.async = true;

        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if(!is_paused){
            getCurrentInfo(currentPos);
        }
    }, [currentPos, getCurrentInfo, is_paused])
    
    useEffect(() => {
        
        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'Synesthesify',
                getOAuthToken: callback => {callback(props.token);},
                volume: 0.5
            })

        setPlayer(player);

        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        player.addListener('player_state_changed', ( state => {

            if (!state) {
                setActive(false);
                return;
            }
            
            setPaused(state.paused);
            if(!state.paused){
                let current = state.track_window.current_track;
                setCurrPos(state.position / 1000);
                console.log(`Now playing - ${current.name}`);
                setNowPlaying(
                    {id: current.id,
                    name: `${current.name} - ${current.artists[0].name}`,
                    albumArt: current.album.images[0].url, 
                    uri: current.uri}
                );

                if(intervalId.current){
                    clearInterval(intervalId.current);
                }
                setNewTrack(true);
                intervalId.current = setInterval(() => {
                    setCurrPos(c => c + 2);
                }, 2000);
            }
            setActive(true);
        }));

        player.connect();

    };}, [props.token]);

    if(!is_active){
        return(
            <div id='playback'>
            <Spinner animation="border" variant="light" /> <h4> Waiting for connection... <br></br>
            Select Synesthesify as your current device on your Spotify mobile app.</h4>
            </div>
        )
        
    }

    else{
        if(newTrack){
            props.getAnalysisData(nowPlaying.id);
            setNewTrack(false);
        }

        if(is_paused){
            if(intervalId.current){
                clearInterval(intervalId.current);
            }
        }
        
        return(
        <div id='playback'>
            <div>Now Playing: {nowPlaying.name}</div> 
            <div><img src={nowPlaying.albumArt} alt='Album Art' style={{ height: 150 }}/></div> 
            <Button variant='success' id="btn-spotify" hidden={is_paused} onClick={() => { player.togglePlay(); setPauseAnimation(!is_paused); }}>
                <MaterialIcon icon="play_arrow"  color={colorPalette.green._50}/> 
            </Button>
            <Button variant='secondary' id="btn-spotify" hidden={!is_paused} onClick={() => { player.togglePlay(); setPauseAnimation(!is_paused); }}>
                <MaterialIcon icon="pause"  color={colorPalette.grey._900}/>
            </Button>
        </div>
        )
    }
    
    
}
      
    