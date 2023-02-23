'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, long]
    this.distance = distance; //km
    this.duration = duration; //min
  }
}
class running extends workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence
    this.calcPace()
  }
  calcPace() {
    //units/km
    this.pace = this.duration / this.distance;
    return this.pace
  }
}
class Cycling extends workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed()
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
const run = new running([30,-40], 5.3, 24,178)
const Cycle = new Cycling([30, -40], 27, 95, 523)

///////////////////APP ARCHITECTURE/////////////////////////////////
class App {
  #map;
  #mapEvent;
  constructor() {
    this._getposition();
    form.addEventListener('submit', this._newWorkOut.bind(this));
    inputType.addEventListener('change', this._toggleElevatiion);
  }
  _getposition() {  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // successfully gotten the position
        this._loadMap.bind(this),
        // unsuccessful in getting the position
        function () {
          alert('Failed: Failed to get your position');
        }
      );
    }
  }

  _loadMap(position) {
    // console.log(position);
    const { latitude: lat } = position.coords;
    const { longitude: long } = position.coords;
    const coordinates = [lat, long];

    this.#map = L.map('map').setView([...coordinates], 13);
    // console.log(map);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevatiion() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    e.preventDefault();
    ///get data from the form
    const type = +inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    
    // if  workput is running then create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      //check if data is active
      if (!Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(cadence)) {
        alert(`inputs have to be positive number`);
        return;
        }
    }
    // if workput is cycling  then create cycling  object
     if (type === 'cycling') {
       const elevation = +inputElevation.value;
     }
    // add the new object to the work out array
    // render workout on the marker as a marker
    let { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('workout')
      .openPopup(); 
    // render  the workout on the list
    // hide the form and clear the input

    //clear input fields
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        ' ';

    //display the marker
    
  }
}
//using the geo location API
//  
const app = new App();

app._getposition();
