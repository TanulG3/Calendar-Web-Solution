let selectedDate = null;


document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    generateCalendar(calendarEl, 2024);
    loadEvents();

    // Event listener for closing the modal
    document.getElementById('closeModalButton').addEventListener('click', function() {
        document.getElementById('eventModal').style.display = 'none';
    });

    // Event listener for the login button
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            document.getElementById('loginModal').style.display = 'block';
        });
    } else {
        console.error('Login button not found');
    }
});

function generateCalendar(calendarEl, year) {
    for (let month = 0; month < 12; month++) {
        calendarEl.appendChild(generateMonth(year, month));
    }
}

function generateMonth(year, month) {
    const monthEl = document.createElement('div');
    monthEl.className = 'month';
    
    // Month header
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const header = document.createElement('h3');
    header.textContent = `${monthName} ${year}`;
    monthEl.appendChild(header);

    // Days of the week header
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysOfWeekRow = document.createElement('div');
    daysOfWeekRow.className = 'weeks-container';
    daysOfWeek.forEach(day => {
        const dayOfWeekEl = document.createElement('div');
        dayOfWeekEl.className = 'day-of-week';
        dayOfWeekEl.textContent = day;
        daysOfWeekRow.appendChild(dayOfWeekEl);
    });
    monthEl.appendChild(daysOfWeekRow);

    // Weeks container
    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'weeks-container';

    // Calculate the first day of the month
    const firstDay = new Date(year, month, 1).getDay();

    // Add empty divs for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyDayEl = document.createElement('div');
        emptyDayEl.className = 'day empty';
        weeksContainer.appendChild(emptyDayEl);
    }

    // Adding days of the month
    const days = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'day';
        dayEl.id = `day-${year}-${month}-${day}`;
        dayEl.textContent = day;
        dayEl.addEventListener('dblclick', () => openModal(year, month, day));
        weeksContainer.appendChild(dayEl);
    }
    monthEl.appendChild(weeksContainer);

    return monthEl;
}


function openModal(year, month, day) {
    selectedDate = { year, month, day };
    document.getElementById('eventModal').style.display = 'block';
}

window.saveEvent = function() {
    const eventName = document.getElementById('eventName').value;
    const eventHub = document.getElementById('eventHub').value;
    const eventData = {
        ...selectedDate,
        eventName,
        eventHub
    };

    fetch('/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('eventModal').style.display = 'none';
        loadEvents(); // Reload events
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function loadEvents() {
    clearEvents(); // Clear existing events before loading new ones

    fetch('/api/events')
    .then(response => response.json())
    .then(events => {
        events.forEach(event => {
            displayEvent(event);
        });
    })
    .catch(error => console.error('Error loading events:', error));
}

function clearEvents() {
    const eventElements = document.querySelectorAll('.event');
    eventElements.forEach(eventEl => eventEl.remove());
}

function displayEvent(event) {
    const { year, month, day, eventName, eventHub } = event;
    const eventElement = document.createElement('div');
    eventElement.className = 'event';
    eventElement.textContent = eventName;
    eventElement.style.fontWeight = "bold";
    // Check if event name contains 'ptt'
    const isPttEvent = eventName.toLowerCase().includes('ptt');

    switch(eventHub) {
        case 'DHKL': setEventColor(eventElement, 'lightblue', isPttEvent); break;
        case 'DHM': setEventColor(eventElement, 'lightgreen', isPttEvent); break;
        case 'DHN': setEventColor(eventElement, 'orange', isPttEvent); break;
        case 'DHMV': setEventColor(eventElement, 'gold', isPttEvent); break;
        case 'HQ': setEventColor(eventElement, 'lavender', isPttEvent); break;
        case 'DHT': setEventColor(eventElement, 'lightcoral', isPttEvent); break;
        case 'ALL HUBS': setEventColor(eventElement, 'cyan', isPttEvent); break;
        // Add more cases as needed
    }

    const dayElement = document.getElementById(`day-${year}-${month}-${day}`);
    if (dayElement) {
        dayElement.appendChild(eventElement);
    }

    eventElement.addEventListener('click', function() {
        openEditModal(event);
    });
}

function setEventColor(element, color, isPttEvent) {
    if (isPttEvent) {
        element.style.backgroundColor = 'white';
        element.style.border = `2px solid ${color}`;
    } else {
        element.style.backgroundColor = color;
    }
}

function openEditModal(event) {
    // Populate the modal with event data
    document.getElementById('editEventName').value = event.eventName;
    document.getElementById('editEventHub').value = event.eventHub;
    
    // Show the modal
    document.getElementById('editEventModal').style.display = 'block';

    // Attach event ID to the modal for reference
    document.getElementById('editEventModal').setAttribute('data-event-id', event._id);
}
// Additional code for handling the modal, etc.

window.saveEditedEvent = function() {
    const eventId = document.getElementById('editEventModal').getAttribute('data-event-id');
    const eventName = document.getElementById('editEventName').value.trim();
    const eventHub = document.getElementById('editEventHub').value;

    // Check if the event name is empty
    if (!eventName) {
        alert("Event name cannot be empty.");
        return;
    }

    fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventName, eventHub }),
    })
    .then(response => {
        if(response.ok) {
            return response.json();
        } else {
            throw new Error('Network response was not ok.');
        }
    })
    .then(data => {
        document.getElementById('editEventModal').style.display = 'none';
        loadEvents();
    })
    .catch(error => console.error('Error:', error));
};



function deleteEvent() {
    const eventId = document.getElementById('editEventModal').getAttribute('data-event-id');
    if (confirm('Are you sure you want to delete this event?')) {
        fetch(`/api/events/${eventId}`, { method: 'DELETE' })
        .then(response => {
            if(response.ok) {
                document.getElementById('editEventModal').style.display = 'none';
                loadEvents();
            } else {
                console.error('Error deleting the event');
            }
        })
        .catch(error => console.error('Error:', error));
    }
}


// Login functionality
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        // Handle login success or failure here
        console.log(data);
        closeLoginModal();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
