import {createArtwork} from './renderer.js';
createArtwork(document.querySelector('#art'),new URLSearchParams(location.search).get('seed')||'97');
