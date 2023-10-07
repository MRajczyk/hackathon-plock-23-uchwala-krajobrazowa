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

const zones = ['Obszar 1', 'Obszar 2', 'Obszar 3'];
const carriers = [
  'Tablice i urządzenia reklamowe',
  'Szyldy',
  'Obiekty małej architektury',
  'Ogrodzenia'
];
const locations = ['Na budynkach', 'Na obiektach', 'Wolnostojące'];

const step = ref(1);
const result = ref("");

const street = ref('');
const buildingNumber = ref('');
const failedZoneFetch = ref(false);

const zone = ref(zones[0]);
const carrier = ref(carriers[0]);
const location = ref(locations[0]);

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
  )

  if(filteredCriteria.length !== 1) {
    return false;
  }

  const criterion = filteredCriteria[0];

  if(criterion.height && (criterion.height < height)) {
    return false;
  }
  if(criterion.width && (criterion.width < width)) {
    return false;
  }

  if(criterion.minArea && (criterion.minArea > area)) {
    return false;
  }
  if(criterion.maxArea && (criterion.maxArea < area)) {
    return false;
  }

  return true;
}

function fetchZone() {
  console.log(isValidAd(2, "tablice", "wolnostojące", "Billboard", 6, 1))
  const result = adresyStrefa.filter(element => {
    return (element.ULIC_NAZWA === street.value) && (element.NUMER == buildingNumber.value);
  });

  failedZoneFetch.value = result.length !== 1;

  if(failedZoneFetch.value) {
    zone.value = zones[0];
    step.value = 1;
  }
  else {
    zone.value = 'Obszar ' + result[0].UK_ID;
    step.value = 2;
  }
}

</script>

<template>
  <header>
  </header>
  <main>
    <div>
      <label>Ulica</label>
      <input name="street" v-model="street">
      <br>

      <label>Numer budynku</label>
      <input name="building_nb" type="number" v-model="buildingNumber">
      <br>

      <input type="button" value="Znajdź strefę" @click="fetchZone" >
    </div>
    <br>

    <div v-if="step > 1">
      <div>
        <p v-if="failedZoneFetch">Nie znaleziono strefy. Wybierz strefę manualnie.</p>
        <label>Strefa</label>
        <select name="zone" v-model="zone">
          <option v-for="zone in zones">{{zone}}</option>
        </select>
      </div>

      <div>
        <label>Nośnik</label>
        <select name="carrier" v-model="carrier">
          <option v-for="c in carriers">{{c}}</option>
        </select>
      </div>

      <div v-if="carrier === 'Szyldy' || carrier.startsWith('Tablice')">
        <label>Lokalizacja</label>
        <select name="location" v-model="location">
          <option v-for="l in locations">{{l}}</option>
        </select>
      </div>
    </div>
  </main>
</template>

<style scoped>

</style>
