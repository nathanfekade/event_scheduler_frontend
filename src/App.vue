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
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background-color: #1a1a1a;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  color: #FDFCFE;
  margin: 0;
  font-size: 1.8rem;
}

.login {
  background-color: #6b46c1;
  width: 90px;
  height: 40px;
  border-radius: 50px;
  color: #FDFCFE;
  font-size: 1.3rem;
  border: none;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.username {
  color: #FDFCFE;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout {
  background-color: #6b46c1;
  width: 90px;
  height: 40px;
  border-radius: 50px;
  color: #FDFCFE;
  font-size: 1.3rem;
  border: none;
  cursor: pointer;
}

.login:hover, .logout:hover {
  background-color: #553c9a;
}
</style>
