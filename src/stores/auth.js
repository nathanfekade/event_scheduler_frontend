import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";
import authService from "../api/authService";

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || null);
    const username = ref(localStorage.getItem('username') || null);

    const isAuthenticated = computed(() => !!token.value);

    const login = async (credentials) =>{
        try {
            const response = await authService.login(credentials);
            token.value = response.data.token;
            username.value = credentials.username;
            localStorage.setItem('token', token.value);
            localStorage.setItem('username', username.value);
            axios.defaults.headers.common['Authorization'] = `Token ${token.value}`

        }catch (error){
            console.error('Login failed:', error);
            throw error;
        }
    };

    const signup = async(userData) => {
        try {

            const signupResponse = await authService.signup(userData);
            if (signupResponse.status === 201){
                
                const loginResponse = await authService.login(userData);
                token.value = loginResponse.data.token;
                username.value = userData.username;
                localStorage.setItem('token', token.value);
                localStorage.setItem('username', username.value);
                axios.defaults.headers.common['Authorization'] = `Token ${token.value}`;
            } else {
                throw new Error ('Signup failed: Unexpected response status')
            }
            
        } catch(error){
            console.error('Signup failed', error);
            throw new Error(error.response?.data.error || 'Signup failed');
        }

    };

    const logout = () => {
        token.value = null;
        username.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        delete axios.defaults.headers.common['Authorization']
    };

    return { token, username, isAuthenticated , login, signup, logout};

});
