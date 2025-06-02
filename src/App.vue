<script setup>
import { useAuthStore } from './stores/auth';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const displayText = computed(() => authStore.username || 'Login');

const handleLogout = () => {
  authStore.logout();
  router.push({ name: 'Authenticate'});
};
</script>

<template>
   <div class="nav">
    <h1>Event Scheduler</h1>
    <router-link v-if="!authStore.username" :to="{ name: 'Authenticate' }" class="login">
      {{ displayText }}
    </router-link> 
    <span v-else class="username">
      {{ authStore.username }}
      <button @click="handleLogout" class="logout">Logout</button>
    </span>
  </div>
  <router-view></router-view>
</template>

<style scoped>
h1{
  color: #FDFCFE;
  margin-left: 40px;
  text-align: left;
}

.login {
    background-color: #8965A3;
    width: 90px;
    height: 40px;
    border-radius: 50px;
    margin-top: -62px;
    margin-right: 25px;
    float: right;
    color: #FDFCFE;
    font-size: 1.3rem;
    border: none;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;

}

.username {
  
  margin-top: -62px;
  margin-right: 25px;
  float: right;
  color: #FDFCFE;
  font-size: 1.3rem;
}

.logout {
  background-color: #8965A3;
  width: 90px;
  height: 40px;
  border-radius: 50px;
  color: #FDFCFE;
  font-size: 1.3rem;
  border: none;
  margin-left: 10px;
}
</style>
