<script setup>
import { ref } from "vue";

const zones = ['Obszar 1', 'Obszar 2', 'Obszar 3'];
const carriers = [
  'Tablice i urządzenia reklamowe',
  'Szyldy',
  'Obiekty małej architektury',
  'Ogrodzenia'
];
const locations = ['Na budynkach', 'Na obiektach', 'Wolnostojące'];

const step = ref(1);

const street = ref('');
const buildingNumber = ref('');
const failedZoneFetch = ref(false);

const zone = ref(zones[0]);
const carrier = ref(carriers[0]);
const location = ref(locations[0]);

function fetchZone() {
  const result = adresy_strefa.filter(element => {
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
