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

const zone = ref(zones[0]);
const carrier = ref("");
const location = ref("");
const type = ref("");

const height = ref("");
const width = ref("");

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

</script>

<template>
  <header>
  </header>
  <main>
    <div>
      <label for="street">Ulica</label>
      <input id="street" name="street" v-model="street">
      <br>

      <label>Numer budynku</label>
      <input name="building_nb" type="number" v-model="buildingNumber">
      <br>

      <button @click="fetchZone">Znajdź strefę</button>
    </div>
    <br>

    <div>
      <div>
        <p v-if="failedZoneFetch">Nie znaleziono strefy. Wybierz strefę manualnie.</p>
        <label>Strefa</label>
        <select name="zone" v-model="zone">
          <option v-for="zone in zones" :value="zone">Obszar {{zone}}</option>
        </select>
      </div>

      <div>
        <label>Nośnik</label>
        <select name="carrier" v-model="carrier">
          <option v-for="c in carriers">{{c}}</option>
        </select>
      </div>

      <div v-if="carrier === 'Szyldy' || carrier.startsWith('tablice')">
        <label>Lokalizacja</label>
        <select name="location" v-model="location">
          <option v-for="l in locations">{{l}}</option>
        </select>
      </div>

      <div>
        <label>Typ</label>
        <select name="types" v-model="type">
          <option v-for="l in types">{{l}}</option>
        </select>
      </div>

      <div>
        <label>Wysokość</label>
        <input type="number" v-model="height" min="0"><br>
        <label>Szerokość</label>
        <input type="number" v-model="width" min="0"><br>
        <br>
        <button @click="isValidAd(zone, carrier, location, type, height, width)">Sprawdź</button>
        <p>{{result}}</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
  * {
    font-family: 'Source Sans Pro',sans-serif;
    background-color: #fff;
    outline: none;
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
    border-color: #ced4da;
    border-style: solid;
    border-bottom-width: 0.0625rem;
    border-left-width: 0.0625rem;
    border-right-width: 0.0625rem;
    border-top-width: 0.0625rem;
    border-radius: 0.25rem;
  }
</style>
