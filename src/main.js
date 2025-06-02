import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';
import router from  './router';
import axios from 'axios';
import { useAuthStore } from './stores/auth';

axios.defaults.baseURL = 'http://127.0.0.1:8000/';

const app = createApp(App);
app.use(createPinia());
app.use(router);

router.isReady().then(() => {
    const authStore = useAuthStore();
    if (authStore.token){
        axios.defaults.headers.common['Authorization'] = `Token ${authStore.token}`;
    }
    app.mount('#app')
});
