import axios from "axios";

export default {
    
    getAllEvents() {
        return axios.get('/api/events/');
    },

    createEvent(formData) {
        return axios.post('api/events/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    updateEvent(id, formData) {
        return axios.put(`api/events/${id}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deleteEvent(id) {
        return axios.delete(`/api/events/${id}/`);
    }
};