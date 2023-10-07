<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import criteria from "./kryteria";

let adresyStrefa;

onMounted(() => {
  axios.get('http://localhost:3000/addresses')
      .then(function (response) {
        adresyStrefa = response.data;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
})

const zones = [1, 2, 3];
const carriers = [
  'tablice',
  'Szyldy',
  'Obiekty małej architektury',
  'Ogrodzenia'
];
const locations = ['na budynkach', 'na obiektach', 'wolnostojące'];
const types = ['Słup ogłoszeniowo-reklamowy', 'Gablota ekspozycyjna typu City Light Poster (CLP)', 'Stojak reklamowy - sztaluga', 'Stojak reklamowy - potykacz', 'Billboard'];

const result = ref("");

const street = ref('');
const buildingNumber = ref('');
const failedZoneFetch = ref(false);

const zone = ref("");
const carrier = ref("");
const location = ref("");
const type = ref("");

const height = ref("");
const width = ref("");

const showTabsFlag = ref(0);

function isValidAd(zone, carrier, placement, type, height, width) { //todo: rename
  let area;
  if(height && width) {
    area = height * width;
  }

  const filteredCriteria = criteria.filter(criterion =>
      criterion.zone === zone &&
      criterion.carrier === carrier &&
      criterion.placement === placement &&
      criterion.type === type
  );

  if(filteredCriteria.length !== 1) {
    result.value = "Reklama nie spełnia wymagań";
    return null;
  }

  const criterion = filteredCriteria[0];

  if(criterion.height && (criterion.height < height)) {
    result.value = "Reklama nie spełnia wymagań";
    return;
  }
  if(criterion.width && (criterion.width < width)) {
    result.value = "Reklama nie spełnia wymagań";
    return;
  }

  if(criterion.minArea && (criterion.minArea > area)) {
    result.value = "Reklama nie spełnia wymagań";
    return;
  }
  if(criterion.maxArea && (criterion.maxArea < area)) {
    result.value = "Reklama nie spełnia wymagań";
    return;
  }

  result.value = criterion.conditions;
}

function fetchZone() {
  const result = adresyStrefa.filter(element => {
    return (element.ULIC_NAZWA === street.value) && (element.NUMER == buildingNumber.value);
  });

  failedZoneFetch.value = result.length !== 1;

  if(failedZoneFetch.value) {
    zone.value = zones[0];
  }
  else {
    zone.value = result[0].UK_ID;
  }
}

function setShowTabsFlag(value) {
  showTabsFlag.value = value;
}

</script>

<template>
  <header>
  </header>
  <main>
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
      <div v-if="showTabsFlag===2">
        MAPA
      </div>
      <p style="border-bottom: 1px solid #D6D6D6; margin-bottom: 10px; margin-top: 10px"></p>
      <div>
        <label style="display:block">Nośnik</label>
        <select name="carrier" v-model="carrier">
          <option v-for="c in carriers">{{c}}</option>
        </select>
      </div>

      <div v-if="carrier === 'Szyldy' || carrier.startsWith('tablice')">
        <label style="display:block">Lokalizacja</label>
        <select name="location" v-model="location">
          <option v-for="l in locations">{{l}}</option>
        </select>
      </div>

      <div>
        <label style="display:block">Typ</label>
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
        <button style="display: flex; align-items: center" @click="isValidAd(zone, carrier, location, type, height, width)">
          <span>Sprawdź</span>
          <img src="/survey.png" style="margin-left:10px;" alt="survey icon"/>
        </button>
        <p>{{result}}</p>
      </div>
      <p style="border-bottom: 1px solid #D6D6D6; margin-bottom: 10px; margin-top: 10px"></p>
      <a href="https://nowy.plock.eu/slowniczek/">Nie rozumiesz czegoś? Sprawdź słowniczek!</a>
    </div>
  </main>
</template>

<style scoped>
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
    box-sizing: border-box;
    height: 24px;
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
    box-sizing: border-box;
    height: 24px;
    margin-top: 5px;
    border-color: #ced4da;
    border-style: solid;
    border-bottom-width: 0.0625rem;
    border-left-width: 0.0625rem;
    border-right-width: 0.0625rem;
    border-top-width: 0.0625rem;
    border-radius: 0.25rem;
  }
</style>
