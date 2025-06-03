<script setup>
import { useAuthStore } from '../stores/auth';
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'; 
import rrulePlugin from '@fullcalendar/rrule' 
import { ref, onMounted, computed } from 'vue';
import eventService from '../api/eventService';
import interactionPlugin from '@fullcalendar/interaction';
import { formatInTimeZone } from 'date-fns-tz';
const authStore = useAuthStore();
const showModal = ref(false);
const selectedDate = ref('');
const isEditMode = ref(false);

const recurrenceType = ref('none');
const recurrenceInterval = ref(1);
const selectedWeekdays = ref([false, false, false, false, false, false, false]);
const monthlyType = ref('dayOfMonth');
const endRecurrenceType = ref('never');
const endAfterOccurrences = ref(10);
const endOnDate = ref('');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const newEvent = ref({
  id: null,
  title: '',
  isAllDay: false,
  startTime: '',
  endTime: '',
  rrule: ''
});

const intervalLabel = computed(() => {
  switch (recurrenceType.value) {
    case 'daily': return recurrenceInterval.value > 1 ? 'days' : 'day';
    case 'weekly': return recurrenceInterval.value > 1 ? 'weeks' : 'week';
    case 'monthly': return recurrenceInterval.value > 1 ? 'months' : 'month';
    case 'yearly': return recurrenceInterval.value > 1 ? 'years' : 'year';
    default: return '';
  }
});

function getWeekOfMonth() {
  const date = new Date(selectedDate.value);
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
}

function getOrdinal(n) {
  const suffixes = ['first', 'second', 'third', 'fourth', 'fifth'];
  return suffixes[Math.min(n - 1, 4)];
}

function updateRecurrenceRule() {
  if (recurrenceType.value === 'none') {
    newEvent.value.rrule = '';
    return;
  }

  let rule = `FREQ=${recurrenceType.value.toUpperCase()}`;
  
  if (recurrenceInterval.value > 1) {
    rule += `;INTERVAL=${recurrenceInterval.value}`;
  }
  
  if (recurrenceType.value === 'weekly' && selectedWeekdays.value.some(day => day)) {
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const selectedDays = selectedWeekdays.value
      .map((selected, index) => selected ? days[index] : null)
      .filter(day => day !== null);
    
    if (selectedDays.length > 0) {
      rule += `;BYDAY=${selectedDays.join(',')}`;
    }
  }
  
  if (recurrenceType.value === 'monthly' && monthlyType.value === 'dayOfWeek') {
    const date = new Date(selectedDate.value);
    const dayOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][date.getDay()];
    const weekOfMonth = getWeekOfMonth();
    rule += `;BYDAY=${weekOfMonth}${dayOfWeek}`;
  }
  
  if (endRecurrenceType.value === 'after') {
    rule += `;COUNT=${endAfterOccurrences.value}`;
  } else if (endRecurrenceType.value === 'on' && endOnDate.value) {
    const untilDate = new Date(endOnDate.value);
    const formattedDate = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    rule += `;UNTIL=${formattedDate}`;
  }
  
  newEvent.value.rrule = rule;
}

function parseRrule(rruleString) {
  if (!rruleString) {
    resetRecurrenceUI();
    return;
  }
  
  const parts = rruleString.split(';');
  
  recurrenceInterval.value = 1;
  selectedWeekdays.value = [false, false, false, false, false, false, false];
  monthlyType.value = 'dayOfMonth';
  endRecurrenceType.value = 'never';
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    
    if (key === 'FREQ') {
      recurrenceType.value = value.toLowerCase();
    } else if (key === 'INTERVAL') {
      recurrenceInterval.value = parseInt(value);
    } else if (key === 'BYDAY') {
      if (recurrenceType.value === 'weekly') {
        const days = value.split(',');
        const dayMap = { 'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6 };
        days.forEach(day => {
          if (dayMap[day] !== undefined) {
            selectedWeekdays.value[dayMap[day]] = true;
          }
        });
      } else if (recurrenceType.value === 'monthly') {
        monthlyType.value = 'dayOfWeek';
      }
    } else if (key === 'COUNT') {
      endRecurrenceType.value = 'after';
      endAfterOccurrences.value = parseInt(value);
    } else if (key === 'UNTIL') {
      endRecurrenceType.value = 'on';
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      endOnDate.value = `${year}-${month}-${day}`;
    }
  }
}

function resetRecurrenceUI() {
  recurrenceType.value = 'none';
  recurrenceInterval.value = 1;
  selectedWeekdays.value = [false, false, false, false, false, false, false];
  monthlyType.value = 'dayOfMonth';
  endRecurrenceType.value = 'never';
  endAfterOccurrences.value = 10;
  endOnDate.value = '';
}

function convertToUTC(dateStr, timeStr) {
  if (!timeStr) return new Date(dateStr).toISOString();
  
  const localDateTime = `${dateStr}T${timeStr}:00`;
  
  const localDate = new Date(localDateTime);
  
  const utcYear = localDate.getUTCFullYear();
  const utcMonth = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const utcDay = String(localDate.getUTCDate()).padStart(2, '0');
  const utcHours = String(localDate.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(localDate.getUTCMinutes()).padStart(2, '0');
  const utcSeconds = String(localDate.getUTCSeconds()).padStart(2, '0');
  
  return `${utcYear}-${utcMonth}-${utcDay}T${utcHours}:${utcMinutes}:${utcSeconds}Z`;
}

function convertFromUTC(utcDateStr) {
  if (!utcDateStr) return '';
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = new Date(utcDateStr);
  return formatInTimeZone(date, userTimeZone, 'HH:mm');
}


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
  dateClick: function(info) {
    selectedDate.value = info.dateStr;
    isEditMode.value = false;
    newEvent.value = {
      id: null,
      title: '',
      isAllDay: false,
      startTime: '',
      endTime: '',
      rrule: ''
    };
    resetRecurrenceUI();
    showModal.value = true;
  },
  eventClick: function(info) {
    const event = info.event;
    isEditMode.value = true;
    selectedDate.value = event.startStr.split('T')[0];
    newEvent.value = {
      id: event.id,
      title: event.title,
      isAllDay: event.allDay,
      startTime: event.allDay ? '' : convertFromUTC(event.startStr),
      endTime: event.end ? convertFromUTC(event.endStr) : '',
      rrule: event.extendedProps.rrule || ''
    };
    parseRrule(newEvent.value.rrule);
    showModal.value = true;
  },
  editable: true
});

async function deleteEvent(event) {
  try {
    await eventService.deleteEvent(event.id);
    await fetchEvents(); 
    closeModal();
  } catch (error) {
    console.error('Error deleting event:', error);
    alert('Failed to delete event');
  }
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

async function create() {
  if (!newEvent.value.title) {
    alert('Title is required');
    return;
  }
  if (!newEvent.value.isAllDay) {
    if (!/^\d{2}:\d{2}$/.test(newEvent.value.startTime)) {
      alert('Start time must be in HH:MM format');
      return;
    }
    if (newEvent.value.endTime && !/^\d{2}:\d{2}$/.test(newEvent.value.endTime)) {
      alert('End time must be in HH:MM format');
      return;
    }

    const startParsed = parseTime(newEvent.value.startTime);
    const endParsed = parseTime(newEvent.value.endTime);
    if (
      endParsed &&
      (endParsed.hour < startParsed.hour ||
        (endParsed.hour === startParsed.hour && endParsed.minute <= startParsed.minute))
    ) {
      alert('End time must be after start time on the same day');
      return;
    }
  }

  const eventData = {
    title: newEvent.value.title,
    start_time: newEvent.value.isAllDay 
      ? new Date(selectedDate.value).toISOString()
      : convertToUTC(selectedDate.value, newEvent.value.startTime),
    end_time: newEvent.value.isAllDay || !newEvent.value.endTime
      ? null
      : convertToUTC(selectedDate.value, newEvent.value.endTime),
    is_all_day: newEvent.value.isAllDay,
    recurrence_rule: newEvent.value.rrule || null
  };

  try {
    let response;
    if (isEditMode.value) {
      response = await eventService.updateEvent(newEvent.value.id, eventData);
    } else {
      response = await eventService.createEvent(eventData);
    }
    await fetchEvents(); 
    closeModal();
  } catch (error) {
    console.error('Error saving event:', error);
    alert('Failed to save event');
  }
}

function closeModal() {
  showModal.value = false;
  isEditMode.value = false;
  newEvent.value = {
    id: null,
    title: '',
    isAllDay: false,
    startTime: '',
    endTime: '',
    rrule: ''
  };
  resetRecurrenceUI();
}

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
  <div class="page-container">
    <div class="calendar-container">
      <FullCalendar :options="calendarOptions" />
    </div>  
    <div v-if="showModal">
      <div class="modal-overlay">
        <div class="modal-content">
          <h2>{{ isEditMode ? 'Edit Event' : 'Create Event' }}</h2>
          <form @submit.prevent="create">
            <div class="form-group">
              <label>Event Title</label>
              <input
                v-model="newEvent.title"
                type="text"
                required
              />
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="newEvent.isAllDay"
                />
                <span>All Day Event</span>
              </label>
            </div>

            <div v-if="!newEvent.isAllDay" class="form-group">
              <label>Start Time ({{ Intl.DateTimeFormat().resolvedOptions().timeZone }})</label>
              <input
                v-model="newEvent.startTime"
                type="text"
                placeholder="e.g., 14:00"
                pattern="\d{2}:\d{2}"
                title="Time must be in HH:MM format"
                required
              />
            </div>

            <div v-if="!newEvent.isAllDay" class="form-group">
              <label>End Time ({{ Intl.DateTimeFormat().resolvedOptions().timeZone }}, optional)</label>
              <input
                v-model="newEvent.endTime"
                type="text"
                placeholder="e.g., 16:00"
                pattern="\d{2}:\d{2}"
                title="Time must be in HH:MM format"
              />
            </div>

            <div class="form-group">
              <label>Recurrence</label>
              <div class="recurrence-options">
                <div class="recurrence-type">
                  <label class="checkbox-label">
                    <input
                      type="radio"
                      v-model="recurrenceType"
                      value="none"
                      @change="updateRecurrenceRule"
                    />
                    <span>No Recurrence</span>
                  </label>
                  
                  <label class="checkbox-label">
                    <input
                      type="radio"
                      v-model="recurrenceType"
                      value="daily"
                      @change="updateRecurrenceRule"
                    />
                    <span>Daily</span>
                  </label>
                  
                  <label class="checkbox-label">
                    <input
                      type="radio"
                      v-model="recurrenceType"
                      value="weekly"
                      @change="updateRecurrenceRule"
                    />
                    <span>Weekly</span>
                  </label>
                  
                  <label class="checkbox-label">
                    <input
                      type="radio"
                      v-model="recurrenceType"
                      value="monthly"
                      @change="updateRecurrenceRule"
                    />
                    <span>Monthly</span>
                  </label>
                  
                  <label class="checkbox-label">
                    <input
                      type="radio"
                      v-model="recurrenceType"
                      value="yearly"
                      @change="updateRecurrenceRule"
                    />
                    <span>Yearly</span>
                  </label>
                </div>
                
                <div v-if="recurrenceType !== 'none'" class="recurrence-interval">
                  <label>Repeat every:</label>
                  <div class="interval-input">
                    <input 
                      type="number" 
                      v-model="recurrenceInterval" 
                      min="1" 
                      max="99"
                      @change="updateRecurrenceRule"
                    />
                    <span>{{ intervalLabel }}</span>
                  </div>
                </div>
                
                <div v-if="recurrenceType === 'weekly'" class="weekday-selection">
                  <label>On these days:</label>
                  <div class="weekdays">
                    <label v-for="(day, index) in weekdays" :key="index" class="day-checkbox">
                      <input 
                        type="checkbox" 
                        v-model="selectedWeekdays[index]"
                        @change="updateRecurrenceRule"
                      />
                      <span>{{ day }}</span>
                    </label>
                  </div>
                </div>
                
                <div v-if="recurrenceType === 'monthly'" class="monthly-options">
                  <div>
                    <label class="checkbox-label">
                      <input 
                        type="radio" 
                        v-model="monthlyType" 
                        value="dayOfMonth"
                        @change="updateRecurrenceRule"
                      />
                      <span>On day {{ new Date(selectedDate).getDate() }} of the month</span>
                    </label>
                  </div>
                  <div>
                    <label class="checkbox-label">
                      <input 
                        type="radio" 
                        v-model="monthlyType" 
                        value="dayOfWeek"
                        @change="updateRecurrenceRule"
                      />
                      <span>On the {{ getOrdinal(getWeekOfMonth()) }} {{ weekdays[new Date(selectedDate).getDay()] }} of the month</span>
                    </label>
                  </div>
                </div>
                
                <div v-if="recurrenceType !== 'none'" class="end-recurrence">
                  <label>End:</label>
                  <div>
                    <label class="checkbox-label">
                      <input 
                        type="radio" 
                        v-model="endRecurrenceType" 
                        value="never"
                        @change="updateRecurrenceRule"
                      />
                      <span>Never</span>
                    </label>
                  </div>
                  <div>
                    <label class="checkbox-label">
                      <input 
                        type="radio" 
                        v-model="endRecurrenceType" 
                        value="after"
                        @change="updateRecurrenceRule"
                      />
                      <span>After</span>
                    </label>
                    <input 
                      v-if="endRecurrenceType === 'after'"
                      type="number" 
                      v-model="endAfterOccurrences" 
                      min="1" 
                      max="999"
                      class="small-input"
                      @change="updateRecurrenceRule"
                    />
                    <span v-if="endRecurrenceType === 'after'">occurrences</span>
                  </div>
                  <div>
                    <label class="checkbox-label">
                      <input 
                        type="radio" 
                        v-model="endRecurrenceType" 
                        value="on"
                        @change="updateRecurrenceRule"
                      />
                      <span>On date</span>
                    </label>
                    <input 
                      v-if="endRecurrenceType === 'on'"
                      type="date" 
                      v-model="endOnDate"
                      @change="updateRecurrenceRule"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button
                v-if="isEditMode"
                type="button"
                class="delete-button"
                @click="deleteEvent({ id: newEvent.id, title: newEvent.title })"
              >
                Delete
              </button>
              <button
                type="button"
                @click="closeModal"
              >
                Cancel
              </button>
              <button
                type="submit"
              >
                {{ isEditMode ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.calendar-container {
  width: 90%;
  max-width: 1200px;
  height: 85vh;
  background-color: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  margin: auto;
}

:deep(.fc) {
  height: 100% !important;
  max-height: 100% !important;
  background-color: transparent;
}

:deep(.fc-view-harness) {
  background-color: #2d2d2d;
  border-radius: 8px;
}

:deep(.fc-theme-standard) {
  color: #ffffff;
}

:deep(.fc-toolbar-title) {
  color: #ffffff;
  font-size: 1.5rem !important;
}

:deep(.fc-button-primary) {
  background-color: #6b46c1 !important;
  border-color: #553c9a !important;
  padding: 0.5rem 1rem !important;
  font-weight: 500 !important;
}

:deep(.fc-button-primary:hover) {
  background-color: #553c9a !important;
  border-color: #44337a !important;
}

:deep(.fc-daygrid-day) {
  background-color: #2d2d2d;
  border-color: #404040 !important;
}

:deep(.fc-day-today) {
  background-color: #3c366b !important;
}

:deep(.fc-daygrid-event) {
  background-color: #6b46c1;
  border-color: #553c9a;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin: 1px 0;
}

:deep(.fc-daygrid-event:hover) {
  background-color: #553c9a;
}

:deep(.fc-col-header-cell) {
  background-color: #2d2d2d;
  color: #ffffff;
  border-color: #404040 !important;
  padding: 0.75rem 0;
}

:deep(.fc-list-day-cushion) {
  background-color: #2d2d2d !important;
  color: #ffffff !important;
}

:deep(.fc-list-event:hover td) {
  background-color: #3c366b !important;
}

:deep(.fc-list-event-title a) {
  color: #ffffff !important;
}

:deep(.fc-timegrid-slot) {
  background-color: #2d2d2d;
  border-color: #404040 !important;
}

:deep(.fc-scrollgrid) {
  border-color: #404040 !important;
}

:deep(.fc-day-disabled) {
  background-color: #1a1a1a !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(10, 11, 15, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.modal-content {
  position: relative;
  background-color: #1a1a1a;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(107, 70, 193, 0.2);
  color: #FDFCFE;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.form-actions button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

button[type="submit"] {
  background-color: #4CAF50;
  color: white;
  border: none;
}

button[type="button"] {
  border: 1px solid #ddd;
}

.delete-button {
  color: white;
  background-color: #ae0909;
  border: none;
  margin-right: auto;
}

.recurrence-options {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.recurrence-type {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.recurrence-interval {
  margin-bottom: 1rem;
}

.interval-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.interval-input input {
  width: 60px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.weekday-selection {
  margin-bottom: 1rem;
}

.weekdays {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.5rem;
}

.monthly-options {
  margin-bottom: 1rem;
}

.end-recurrence {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.small-input {
  width: 60px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 0 0.5rem;
}

input[type="date"] {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-left: 0.5rem;
}
</style>