<script setup>
import { useAuthStore } from '../stores/auth';
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'; 
import rrulePlugin from '@fullcalendar/rrule' 
import { ref, onMounted } from 'vue';
import eventService from '../api/eventService';
import interactionPlugin from '@fullcalendar/interaction';
const authStore = useAuthStore();



const calendarOptions = ref({
    plugins: [dayGridPlugin, listPlugin, rrulePlugin, interactionPlugin], 
    initialView: 'dayGridMonth',         
    headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek,listWeek' 
  },
  events: [],
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    meridiem: false
  },

});

async function fetchEvents() {
  try {
    const response = await eventService.getAllEvents()
    const events = await response.data
    
    calendarOptions.value.events = events.map(event => {
      const fcEvent = {
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time || null,
        allDay: event.is_all_day
      };

      if (event.recurrence_rule) {
        fcEvent.rrule = event.recurrence_rule; 
      }

      return fcEvent;
    });
  } catch (error) {
    console.error('Error fetching events:', error);
  }
}

onMounted(() => {
  fetchEvents()
})

</script>

<template>
<FullCalendar :options="calendarOptions" />
</template>

<style scoped>

</style>