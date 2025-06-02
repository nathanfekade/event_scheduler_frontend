import axios from "axios";

export default {
    
    login(credentials) {
        return axios.post('/api-token-auth/', credentials);
    },

    signup(userData) {
        return axios.post('/signup/', userData);
    }
};