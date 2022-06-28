import React, { useEffect, useState } from 'react';
import { DropdownButton, Dropdown, Modal, Button } from 'react-bootstrap';
import './App.css';
import { ReactP5Wrapper } from "react-p5-wrapper";
import { sketch } from './sketch.js';
import SpotifyWebApi from 'spotify-web-api-node';
import CustomPlayer from './SpPlayer.js';

const bad_status_codes = [204, 404]; // 204 is No Content, 404 is Not Found

const spotifyApi = new SpotifyWebApi(); // Spotify Web API object

/* 
* function: getHashParams()
* params: none 
* does: Retrieves parameters from window 
*/
function getHashParams() {
  var hashParams = {};

  // Regex to retrieve parameters from window
  var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
  e = r.exec(q)
  while (e) {
     hashParams[e[1]] = decodeURIComponent(e[2]);
     e = r.exec(q);
  }
  return hashParams;
}

/* 
* function: LoginModal 
* @param props - List of values obtained from component
* does: Show a modal directing the user to log in with Spotify
*/
function LoginModal(props){
  return(
    <Modal
    {...props}
    size="lg"
    aria-labelledby="contained-modal-title-vcenter"
    centered>
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Log in with Spotify
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Button variant="success" href='http://localhost:8888/login'>Login</Button>
      </Modal.Body>
    </Modal>
  )
}

function App() {
  const [flavor, setFlavor] = useState("tangerine"); // color gradient for the current visual
  const [shape, setShape] = useState("star"); /* shape - shape for the current visualizer 
  (TODO: Rework when adding additional visualizer components) */
  const [loginModalShow, setloginModalShow] = useState(false); // bool for displaying login modal 
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
  const [trackInfo, setTrackInfo] = useState({
    /* 
     * object: trackInfo: An object defining the analytic info obtained from a track
     * currently playing in the browser 
     * loudness - The overall loudness of a track in decibels (dB).
     * tempo - The overall estimated tempo (speed) of a track in beats per minute (BPM).
     * key - The key the track is in.
     */
      loudness: 0.0,
      tempo: 0.0,
      key: -1
  })
  const [loggedIn, setLoggedIn] = useState(false);  // bool for confirming user auth status
  const [acc_token, setAccToken] = useState(''); // access token required to connect with Spotify
  const params = getHashParams(); // parameters retrieved from browser window

  useEffect(() => {
    if(params.access_token) {
      // Retrieve and set access token, retrieve refresh token, and set logged in status
      spotifyApi.setAccessToken(params.access_token);
      setAccToken(params.access_token);
      spotifyApi.setRefreshToken(params.refresh_token);
      setLoggedIn(true);
    }
  }, [params]);
  

  /* 
  * function: getNowPlaying 
  * @param - none
  * does: GET request for general info related to the track currently playing in browser
  */
  const getNowPlaying = () => {
      spotifyApi.getMyCurrentPlaybackState()
      .then((res) => {
        if(!bad_status_codes.includes(res.statusCode)){ // Check for error codes
          let current = res.body.item; // This contains the info we want
          setNowPlaying({
            id: current.id,
            name: `${current.name} - ${current.artists[0].name}`,
            albumArt: current.album.images[0].url,
            uri: current.uri
          });
        }
          
      }, (err) => {console.log(`Error occured: ${err.status} - ${err.message}`)});
  }

  /* 
  * function: getNowPlaying 
  * @param - none
  * does: GET request for audio analysis info related to the track currently playing in browser
  */
  const getAudioAnalysis = () => {
    spotifyApi.getAudioAnalysisForTrack(nowPlaying.id)
    .then((res) => {
      if(!bad_status_codes.includes(res.statusCode)){ // Check for error codes
        let analysis = res.body.track;  // This contains the info we want
        setTrackInfo({
          loudness: analysis.loudness,
          tempo: analysis.tempo,
          key: analysis.key
        })
        console.log(trackInfo);
      }
    }, (err) => {console.log(`Error occured: ${err.status} - ${err.message}`)});
  }

  return (
    <div className="App">
      <header className="App-header">
        <div>
          {/* The visual component is rendered using p5.js. For more info: https://p5js.org/ */}
          <ReactP5Wrapper 
          sketch={sketch} 
          gradient_flavor={flavor} 
          shape={shape}
          factor={trackInfo.tempo}
          scale={trackInfo.loudness}/>
        </div>

        {/* Dropdown buttons for debugging visual components below */}
        <DropdownButton
        id={`dropdown-button-drop-end`}
        variant={'primary'}
        drop='end'
        title={`Choose your flavor`}
        onSelect={(f) => setFlavor(f)}
        >
          <Dropdown.Item eventKey="tangerine">tangerine</Dropdown.Item>
          <Dropdown.Item eventKey="green_apple">green apple</Dropdown.Item>
          <Dropdown.Item eventKey="blue_razz">blue razzberry</Dropdown.Item>
          <Dropdown.Item eventKey="rainbow">happy pride</Dropdown.Item>
        </DropdownButton>
        <DropdownButton
        id={`dropdown-button-drop-down`}
        variant={'primary'}
        drop='down'
        title={`Choose your shape`}
        onSelect={(f) => setShape(f)}
        >
          <Dropdown.Item eventKey="star">star</Dropdown.Item>
          <Dropdown.Item eventKey="circle">circle</Dropdown.Item>
        </DropdownButton>
        <LoginModal
        show={loginModalShow}
        onHide={() => setloginModalShow(false)} 
        />

        {/* Music control section of the app below */}
        <div id='now_playing'>
          <div>Now Playing: {nowPlaying.name}</div>
          <div><img src={nowPlaying.albumArt} alt='Album Art' style={{ height: 150 }}/></div>
          {/* The divs below are conditioned to appear depending on user's login status */}
          {(!loggedIn) ? <Button variant='success' onClick={() => setloginModalShow(true)}>
            Log in with Spotify
          </Button> : <div></div>}
          {(loggedIn) ? <CustomPlayer token={acc_token} /> : <div></div>}
          {loggedIn && nowPlaying && <Button onClick={() => {getNowPlaying(); getAudioAnalysis();}}>Synesthesizer</Button>}
        </div>
      </header>
    </div>
  );
}


export default App;
