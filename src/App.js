import React, { useEffect, useState } from 'react';
import { Nav, NavDropdown, Container, Modal, Button, Navbar, ProgressBar } from 'react-bootstrap';
import './App.css';
import { ReactP5Wrapper } from "react-p5-wrapper";
import { Sketch2D, Sketch3D } from './sketch.js';
import SpotifyWebApi from 'spotify-web-api-node';
import CustomPlayer from './SpPlayer.js';
import GradientCollection from './gradients.js';

const gradients = new GradientCollection();
const bad_status_codes = [204, 404, 403]; // 204 is No Content, 404 is Not Found, 403 is Forbidden
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
  const [flavor, setFlavor] = useState("rainbow"); // color gradient for the current visual
  const [shape, setShape] = useState("star"); /* shape - shape for the current visualize */
  const [visualMode, setVisualMode] = useState("s2D");
  const [loginModalShow, setloginModalShow] = useState(false); // bool for displaying login modal 
  
  const [analysisInfo, setAnalysisInfo] = useState({});
  const [trackInfo, setTrackInfo] = useState({
    key: -1,
    loudness: 0,
    tempo: 0
  });
  const [pauseAnimation, setPauseAnimation] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false); 
  const [acc_token, setAccToken] = useState(''); // access token required to connect with Spotify
  const [c_index, setIndex] = useState(0);
  const [in_new_section, setInNewSection] = useState(false);
  const [duration, setDuration] = useState(1.0);
  const [current_pos, setCurrentPos] = useState(0.0);
  const params = getHashParams();
  const shape_book = {s2D: ['star', 'circle', 'square'],
                      s3D: ['box', 'ball', 'donut']};

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
  * function: getTrackAnalysis 
  * @param - id: the Spotify id for the track currently playing
  * does: GET request for general info related to the track currently playing in browser
  */
  const getTrackAnalysis = (id) => {
    let analysis, song_duration;
      spotifyApi.getAudioAnalysisForTrack(id)
      .then((res) => {
      if(!bad_status_codes.includes(res.statusCode)){ // Check for error codes
        song_duration = res.body.track.duration;
        analysis = res.body.sections;
        setAnalysisInfo(analysis);
        if(song_duration > 0){
          setDuration(song_duration);
        }
        setIndex(0);
        setInNewSection(true);
        }
      }, (err) => {console.log(`Error occured: ${err?.status} - ${err?.message}`)});
  }

  const getSegmentValues = (msec) => {
    if(analysisInfo)
    {
      let current_section = analysisInfo[c_index];
      setCurrentPos(msec);
      if(current_section)
      {
        let in_section = (msec >= current_section.start) && (msec <= current_section.start + current_section.duration);
        if(in_new_section){
          setTrackInfo({
            key: current_section.key,
            loudness: current_section.loudness,
            tempo: current_section.tempo
          });
          setInNewSection(false);
        } 
        
        if (!in_section) {
          let next = analysisInfo.findIndex((e) => {
            return (msec >= e.start) && (msec <= e.start + e.duration);
          });
          setIndex(next);
          setInNewSection(true);}
        }
    }

    else{
      setTrackInfo({
        key: -1,
        loudness: 0,
        tempo: 0
      });
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <Navbar expand="lg" bg='dark' variant='dark'>
          <Container>
            <Navbar.Brand href='/'>
              Synesthesify
            </Navbar.Brand>
            <Nav className="me-auto">
              <NavDropdown title="Visual Mode" className='nav-dropdown' onSelect={(ek) => {setVisualMode(ek); setFlavor("rainbow"); setShape(shape_book[ek][0]);}}>
                <NavDropdown.Item eventKey={'s2D'}>2D Mode</NavDropdown.Item>
                <NavDropdown.Item eventKey={'s3D'}>3D Mode</NavDropdown.Item>
              </NavDropdown>
              <NavDropdown title={`Choose your flavor`} className='nav-dropdown' onSelect={(f) => setFlavor(f)}>
                {(visualMode === "s2D" && Object.keys(gradients.g2D).map((flav) =>
                {
                  return (<NavDropdown.Item eventKey={flav}>{flav}</NavDropdown.Item>);
                })) || 
                (visualMode === "s3D" && Object.keys(gradients.g3D).map((flav) =>
                {
                  return (<NavDropdown.Item eventKey={flav}>{flav}</NavDropdown.Item>);
                }))}
              </NavDropdown>
              <NavDropdown title={`Choose your shape`} className='nav-dropdown' onSelect={(f) => setShape(f)}>
                {shape_book[visualMode].map((shp) =>
                {
                  return (<NavDropdown.Item eventKey={shp}>{shp}</NavDropdown.Item>);
                })}
              </NavDropdown>
            </Nav>
          </Container>
        </Navbar>
        
      </header>
      <body className='App-body'>
      <div>
          {/* The visual component is rendered using p5.js. For more info: https://p5js.org/ */}
          {(visualMode === "s2D" && 
          <ReactP5Wrapper 
          sketch={Sketch2D} 
          gradient_flavor={flavor} 
          shape={shape}
          factor={trackInfo.tempo}
          scale={trackInfo.loudness}
          pause={pauseAnimation}/>) ||
          (visualMode === "s3D" &&
          <ReactP5Wrapper 
          sketch={Sketch3D} 
          gradient_flavor={flavor} 
          shape={shape}
          factor={trackInfo.tempo}
          scale={trackInfo.loudness}
          pause={pauseAnimation}/>)}
        </div>
        <LoginModal
        show={loginModalShow}
        onHide={() => setloginModalShow(false)} 
        />
        {/* Music control section of the app below */}
        <div id='now_playing'>
          {/* The elements below are conditioned to appear depending on user's login status */}
          {loggedIn && <ProgressBar variant='success' now={(current_pos/duration)*100} label={` ${Math.floor(current_pos/60)}:${current_pos%60 < 10 ? '0'+String(Math.floor(current_pos%60)) : Math.floor(current_pos%60)} `}/>}
          <Button variant='success' hidden={loggedIn} onClick={() => setloginModalShow(true)}>
            Log in
          </Button>
          {loggedIn && <CustomPlayer token={acc_token} getAnalysisData={getTrackAnalysis} 
          getCurrentInfo={getSegmentValues} 
          setPauseAnimation={setPauseAnimation} />}
          
        </div>
      </body>
    </div>
  );
}


export default App;
