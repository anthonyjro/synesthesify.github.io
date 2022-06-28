import { useState, useEffect } from "react";

const SDK_SOURCE = 'https://sdk.scdn.co/spotify-player.js';

export default function CustomPlayer(props){

    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState(undefined);
    
    useEffect(() => {
        const script = document.createElement("script");
        script.src = SDK_SOURCE;
        script.async = true;

        document.body.appendChild(script);

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
                    return;
                }

                setPaused(state.paused);

                player.getCurrentState().then( state => { 
                    (!state)? setActive(false) : setActive(true) 
                });

            }));

            player.connect();
        };
        }, [props.token]);

    if(!is_active){
        return(
            <div id='playback'>
            <h1>Instance not active.</h1>
            </div>
        )
        
    }

    else{
        return(
        <div id='playback'>
            <button className="btn-spotify" onClick={() => { player.togglePlay() }}>
                { is_paused ? "PLAY" : "PAUSE" }
            </button>
        </div>
        )
    }
    
    
}
      
    