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
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, long]
    this.distance = distance; //km
    this.duration = duration; //min
   
  }
  click() {
    this.clicks++
  }
  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
}

class running extends workout {
  type="running"

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence
    this.calcPace()
    this.setDescription()
  }

  calcPace() {
    //units/km
    this.pace = this.duration / this.distance;
    return this.pace
  }
}

class Cycling extends workout {
  type="cycling"
  
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed()
    this.setDescription()
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }

}
const run = new running([30,-40], 5.3, 24,178);
const Cycle = new Cycling([30, -40], 27, 95, 523);

///////////////////APP ARCHITECTURE/////////////////////////////////
class App {
  #map;
  #mapEvent;
  #workout = [];
  #mapZoomLevel = 13;
  constructor() {
    // get positions;
    this._getposition();
    // get date from local storage
    this.getLocalStorage();
    // add event handlers;
    form.addEventListener('submit', this._newWorkOut.bind(this));
    inputType.addEventListener('change', this._toggleElevatiion);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
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

    this.#map = L.map('map').setView([...coordinates], this.#mapZoomLevel);
    // console.log(map);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
      this.#workout.forEach(work => {
        this.renderWorkout(work);
        this.renderWorkOutMarker(work);
      });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //empty the input form
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        ' ';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevatiion() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    const validinput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositives = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();
    ///get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if  workout is running then create running object.
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //check if data is active.
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validinput(distance, duration, cadence) ||
        !allPositives(distance, duration, cadence)
      ) {
        return alert(`inputs have to be positive number`);
      }
      workout = new running([lat, lng], distance, duration, cadence);
    }
    // if workput is cycling  then create cycling  object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validinput(distance, duration, elevation) ||
        !allPositives(distance, duration)
      ) {
        alert(`inputs have to be positive number`);
        return;
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // add the new object to the work out array
    this.#workout.push(workout);
    // render workout on the marker as a marker
    // let { lat, lng } = this.#mapEvent.latlng;
    this.renderWorkOutMarker(workout);
    // render  the workout on the list
    this.renderWorkout(workout);
    // hide the form and clear the input

    //clear input fields

    this._hideForm();

    //display the marker

    //store im local storage
    this.setLocalStorage();
  }
  renderWorkOutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();
  }
  renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃🏾‍♂️' : '🚴🏾‍♂️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>  
    `;
    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      <li/>`;
    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
      </li>
      `;
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(`${e} ws clicked`);
    if (!workoutEl) return;
    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //using the public interface
    // workout.click();
  }
  setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }
  getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workout"));
    // console.log(data);
    if (!data) return;
    this.#workout = data;
    this.#workout.forEach(
      work => {
        this.renderWorkout(work);
      }
    )
  };
  reset() {
    localStorage.removeItem("workout")
    location.reload()
  }
}
//using the geo location API
const app = new App();

app._getposition();
