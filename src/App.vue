<script setup>
import {ref, onMounted, onUnmounted} from "vue";
import axios from "axios";
import {criteria, types} from "./criteria";
import zonesPolygons from './zones';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

let addressToZoneMap = [];

function hideModal(event) {
  const modal = document.getElementById("myModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
}

const zones = [1, 2, 3];
const carriers = [
  'Tablice',
  'Szyldy',
  'Obiekty małej architektury',
  'Ogrodzenia'
];
const locations = ['na budynkach', 'na obiektach', 'wolnostojące'];
// const types comes from './criteria'


const street = ref('');
const buildingNumber = ref('');
const failedZoneFetch = ref(false);

const iterator = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const zone = ref("");
const carrier = ref("");
const location = ref("");
const type = ref("");

const height = ref("");
const width = ref("");
const days = ref(1);

const result = ref(false);
const errors = ref([]);
const conditions = ref([]);

const showTabsFlag = ref(0);
const mapUninitialized = ref(true);

function isValidAd(zone, carrier, placement, type, height, width) {
  errors.value = [];
  conditions.value = [];
  let area;
  if (height && width) {
    area = height * width;
  }

  const filteredCriteria = criteria.filter(criterion =>
      criterion.zone === zone &&
      criterion.carrier === carrier &&
      criterion.placement === placement &&
      criterion.type === type
  );

  if (filteredCriteria.length !== 1) {
    errors.value.push("Podany typ reklamy nie może znajdować się w wybranym obszarze");
  }

  const criterion = filteredCriteria[0];

  if (criterion.height && (criterion.height < height)) {
    errors.value.push("Reklama jest zbyt wysoka - maksymalna wysokość wynosi " + criterion.height + "m");
  }
  if (criterion.width && (criterion.width < width)) {
    errors.value.push("Reklama jest zbyt szeroka - maksymalna szerokość wynosi " + criterion.width + "m");
  }

  if (criterion.minArea && (criterion.minArea > area)) {
    errors.value.push("Reklama ma zbyt małą powierzchnię - minimalna powierzchnia wynosi " + criterion.minArea + "m2");
  }
  if (criterion.maxArea && (criterion.maxArea < area)) {
    errors.value.push("Reklama ma zbyt dużą powierzchnię - maksymalna powierzchnia wynosi " + criterion.maxArea + "m2");
  }

  if(errors.value.length > 0) {
    return false;
  }
  conditions.value = criterion.conditions.split(';');
  return true;
}

function fetchZone() {
  const result = addressToZoneMap.filter(element => {
    return (element.ULIC_NAZWA === street.value) && (element.NUMER == buildingNumber.value);
  });

  failedZoneFetch.value = result.length !== 1;

  if (failedZoneFetch.value) {
    zone.value = zones[0];
  }
  else {
    zone.value = result[0].UK_ID;
  }
}

function setShowTabsFlag(value) {
  showTabsFlag.value = value;
}

function imageExists(img_num) {
  const http = new XMLHttpRequest();
  http.open('HEAD', "/Tablice/Obszar " + zone.value + "/" + location.value + "/" + img_num + ".jpg", false);
  http.send();
  return http.status !== 404;
}

function concatenateImagePath(x) {
   return "/Tablice/Obszar " + zone.value + "/" + location.value + "/" + x + ".jpg";
}

function countFee(days) {
  return ((height.value * width.value * 40 * 0.28 * days) + (40 * 3.14 * days)).toFixed(2);
}

onMounted(() => {
  const modal = document.getElementById("myModal");
  const btn = document.getElementById("myBtn");
  const span = document.getElementsByClassName("close")[0];

  btn.onclick = function() {
    // setShowTabsFlag(1);
    modal.style.display = "block";
  }

  span.onclick = function() {
    modal.style.display = "none";
  }

  window.addEventListener('click', hideModal);

  axios.get('http://localhost:3000/addresses')
      .then(function (response) {
        addressToZoneMap = response.data;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });

  const map = L.map('map').setView([51.505, -0.09], 13);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  zonesPolygons.forEach(elem => {
    elem['polygon'] = L.polygon(elem.latlngs, {color: elem.color})
        .on('click', () => zone.value = elem.id).addTo(map);
  })

  let greatestZone = zonesPolygons.reduce((max, elem) => (elem.id > max.id ? elem : max));
  map.fitBounds(greatestZone.polygon.getBounds());

  mapUninitialized.value = false;
})

onUnmounted(() => {
  window.removeEventListener('click', hideModal)
})
</script>

<template>
  <header>
  </header>
  <main>
    <div id="myModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <div v-for="x in iterator" style="text-align: center; display: block">
          <img v-if="imageExists(x)" :src="concatenateImagePath(x)">
        </div>
      </div>
    </div>
    <div class="check-ad-container">
      <h1>SPRAWDŹ LEGALNOŚĆ REKLAMY</h1>
      <div>
        <div style="display:flex; width: 100%; align-items: center">
          <label style="display: block">Strefa</label>
          <button style="line-height: 10px; font-size: 10px; margin-left:25px;" @click="setShowTabsFlag(1)">Znajdź po adresie</button>&nbsp;
          <button style="line-height: 10px; font-size: 10px;" @click="setShowTabsFlag(2)">Znajdź na mapie</button>
        </div>
        <select style="margin-bottom: 5px" name="zone" v-model="zone">
          <option v-for="zone in zones" :value="zone">Obszar {{zone}}</option>
        </select>
      </div>
      <p v-if="showTabsFlag!==0" style="border-bottom: 1px solid #D6D6D6; margin-bottom: 10px; margin-top: 10px"></p>
      <div v-if="showTabsFlag===1">
        <label style="display: block;" for="street">Ulica</label>
        <input id="street" name="street" v-model="street">
        <br>

        <label style="display: block; margin-top: 10px;">Numer budynku</label>
        <input name="building_nb" type="number" v-model="buildingNumber">
        <br>
        <button style="display: flex; align-items: center; margin-top: 12px; line-height: 20px" @click="fetchZone">
          <span style="font-size: 13px">Znajdź strefę</span>
          <img src="/search.png" style="margin-left:10px; height: 16px;" alt="survey icon"/>
        </button>
        <p v-if="failedZoneFetch">Nie znaleziono strefy. Wybierz strefę manualnie.</p>
      </div>
      <div v-show="showTabsFlag === 2 || mapUninitialized" id="map"></div>
      <p style="border-bottom: 1px solid #D6D6D6; margin-bottom: 10px; margin-top: 10px"></p>
      <div>
        <label style="display:block">Nośnik</label>
        <select name="carrier" v-model="carrier">
          <option v-for="c in carriers">{{c}}</option>
        </select>
      </div>

      <div v-if="carrier === 'Szyldy' || carrier.startsWith('Tablice')">
        <label style="display:block">Lokalizacja</label>
        <select name="location" v-model="location">
          <option v-for="l in locations">{{l}}</option>
        </select>
      </div>

      <div>
        <div style="display:block">
          <label>Typ</label>&nbsp;
          <button id="myBtn">?</button>
        </div>
        <select name="types" v-model="type">
          <option v-for="l in types">{{l}}</option>
        </select>
      </div>

      <div>
        <label style="display:block">Wysokość</label>
        <input type="number" v-model="height" min="0"><br>
      </div>

      <div>
        <label style="display:block">Szerokość</label>
        <input type="number" v-model="width" min="0"><br>
        <br>
        <button style="display: flex; align-items: center"
                @click="result = isValidAd(zone, carrier, location, type, height, width)">
          <span>Sprawdź</span>
          <img src="/survey.png" style="margin-left:10px;" alt="survey icon"/>
        </button>
        <div v-if="conditions.length > 0 && errors.length === 0" class="success">
          Brawo! Reklama spełnia podstawowe kryteria. Teraz upewnij się, że nie łamie ona żadnego z poniższych dodatkowych przepisów:
          <ul style="background-color: inherit">
            <li v-for="condition in conditions" style="background-color: inherit">{{condition}}</li>
          </ul>
        </div>
        <div v-if="errors.length > 0" class="failure">
          Niestety, ale reklama nie spełniła podstawowych wymagań wymienionych poniżej:
          <ul style="background-color: inherit">
            <li v-for="error in errors" style="background-color: inherit">{{error}}</li>
          </ul>
          <div v-if="height && width" style="background-color: inherit">
            Kara za umieszczanie reklamy przez
            <input type="number" v-model="days" min="1" style="display: inline; width: 100px">
            dni wynosi: {{countFee(days)}}zł.
          </div>
          <div v-else style="background-color: inherit">
            Aby zobaczyć dzienną karę za wywieszenie reklamy uzupełnij informacje o wysokości i szerokości.
          </div>
        </div>
      </div>
      <p style="border-bottom: 1px solid #D6D6D6; margin-bottom: 10px; margin-top: 10px"></p>
      <a href="https://nowy.plock.eu/slowniczek/" target="_blank" rel="noopener noreferrer">Nie rozumiesz czegoś? Sprawdź słowniczek!</a>
    </div>
  </main>
</template>

<style scoped>
  #map { height: 360px; }

  * {
    font-family: 'Source Sans Pro',sans-serif;
    font-size: 16px;
    font-weight: 400;
    background-color: #fff;
    outline: none;
    color: #656666;
  }

  h1 {
    color: #182A2F;
    font-size: 54px;
    font-weight: 900;
    margin-top: 15px;
    margin-bottom: 15px;
  }

  .check-ad-container {
    display:flex;
    flex-direction: column;
    gap:10px;
    padding: 20px;
    margin-left: 100px;
    margin-right: 100px;
  }

  main {
    display: block;
  }

  button {
    line-height: 24px;
    padding: 5px 10px;
    position: relative;
    color: #666;
    font-weight: 300;
    border: 1px solid rgba(0, 0, 0, 0.125);
    text-transform: uppercase;
  }

  button:hover {
    cursor: pointer;
  }

  button::after {
    content: '';
    position: absolute;
    width: 100%;
    transform: scaleX(0);
    height: 1px;
    bottom: 0;
    left: 0;
    background-color: #000;
    transform-origin: bottom left;
    transition: transform 0.25s ease-out;
  }

  button:hover::after {
    transform: scaleX(1);
    transform-origin: bottom left;
    outline: none;
  }

  select {
    width: 100%;
    box-sizing: border-box;
    height: 30px;
    margin-top: 5px;
    border-color: rgba(0, 0, 0, 0.125);
    border-style: solid;
    border-bottom-width: 0.0625rem;
    border-left-width: 0.0625rem;
    border-right-width: 0.0625rem;
    border-top-width: 0.0625rem;
    border-radius: 0.25rem;
    outline: none;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    height: 30px;
    margin-top: 5px;
    border-color: #ced4da;
    border-style: solid;
    border-bottom-width: 0.0625rem;
    border-left-width: 0.0625rem;
    border-right-width: 0.0625rem;
    border-top-width: 0.0625rem;
    border-radius: 0.25rem;
  }

  .modal {
    display: none;
    position: fixed;
    z-index: 1001;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.4);
  }

  .modal-content {
    background-color: #fefefe;
    margin: 5% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
  }
  .close {
    color: #aaaaaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
  }
  .close:hover,
  .close:focus {
    color: #000;
    text-decoration: none;
    cursor: pointer;
  }

.success {
  margin-top: 20px;
  background-color: #D4EDDA;
  border: 1px solid green;
  padding: 10px 10px 0 10px;
}

.failure {
  margin-top: 20px;
  background-color: #F8D7DA;
  border: 1px solid red;
  padding: 10px;
}
</style>
