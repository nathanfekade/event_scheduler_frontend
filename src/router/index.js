import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import Home from "../components/Home.vue";
import Authenticate from "../components/Authenticate.vue";

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
        meta: { requiresAuth: true},
    },
    {
        path: '/auth',
        name: 'Authenticate',
        component: Authenticate,
    },
];

const router = createRouter({
        history: createWebHistory(),
        routes,
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    if(to.meta.requiresAuth && !authStore.isAuthenticated){
        next({name: 'Authenticate', query: {redirect: to.fullPath}});
    }else if(to.name === 'Authenticate' && authStore.isAuthenticated){
        next({name: 'Home'});
    }
    else {
        next();
    }
});

export default router;
