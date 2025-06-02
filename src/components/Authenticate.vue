<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isLogin = ref(true);
const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');

const submit = async () => {
    try {
        const credentials = { username: username.value, password: password.value };
        if (isLogin.value){
            await authStore.login(credentials);
        } else {
            const credentialsnew = { username: username.value, password: password.value, email: email.value };
            await authStore.signup(credentialsnew);
        }
        const redirectPath = route.query.redirect || { name: 'Home'};
        router.push(redirectPath);
    } catch (err){
        error.value = isLogin.value? 'Incorrect Username or Password' : 'Signup failed';
    }
};

const  toggleMode = () => {
    isLogin.value = !isLogin.value;
    error.value = '';
};

</script>

<template>
    <div class="auth-wrapper">
        <div class="auth-container">
            <h2>{{ isLogin? 'Login' : 'Sign Up' }}</h2>
            <div class="form">
                <input v-if="!isLogin" v-model="email" placeholder="Email">
                <input v-model="username" placeholder="Username"/>
                <input v-model="password" type="password" placeholder="Password">
                <button @click="submit">{{ isLogin? 'Login' : 'Sign Up' }}</button>
                <p v-if="error" class="error">{{ error }}</p>
                <p>
                    {{ isLogin ? 'Need an account?' : 'Already have an account?'}}
                    <a href="#" @click.prevent="toggleMode">{{ isLogin? 'Sign Up' : 'Login' }}</a>
                </p>

            </div>
        </div>
    </div>
</template>

<style scoped>

.auth-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #1D1E26;
    padding: 20px;
    box-sizing: border-box;
}

.auth-container {
    background-color: #2a2c36;
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    max-width: 400px;
    width: 90%;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #fdfcfe;
    text-align: center;
}

h2{
    margin-bottom: 25px;
    font-size: 2em;
}

.form{
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    max-width: 300px;
}

input{
    padding: 12px;
    border-radius: 5px;
    border: 1px solid #444;
    background-color: #333;
    color: #fdfcfe;
    font-size: 1rem;
}

input::placeholder{
    color: #bbb;
}

button{
    background-color: #8965A3;
    padding: 12PX;
    border-radius: 50PX;
    border: none;
    color: #fdfcfe;
    font-size: 1.3rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: #724c90;
}

.error {
    color: #ff6b6b;
    margin-top: 10px;
    font-size: 0.9em;
}

p{
    margin-top: 20px;
}

a{
    color: #8965A3;
    text-decoration: none;
    transition: color 0.3s ease;
}

a:hover {
    text-decoration: underline;
    color: #a37bc7;
}

</style>
