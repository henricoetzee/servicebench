//app.js - Functions for the app. Task functions are in app_tasks.js

// Main function called by index.html. This only runs if the user is loged in.
function main() {
    // Removes /customer or /task for browser url when refreshing page
    history.pushState("", "", "/");

    // Render summory of tasks on landing page after login
    dashboard();
}

function dashboard() {
    fetch('/dashboard')
    .then(response => response.json())
    .then(response => {
        if (response['status'] == 'failed') {show_message('Failed: ' + response['error']);}
        else if (response['status'] == 'success') {
            canvas = ''
            canvas += `<div class="grid-2"><span class="l">New tasks:</span><span class="r">${response.new_tasks}</span>`;
            canvas += `<span class="l">Your active tasks:</span><span class="r">${response.active_tasks}</span>`;
            canvas += `<span class="l">Your on hold tasks:</span><span class="r">${response.hold_tasks}</span>`;
            if (usertype <= 1) {canvas += `<span class="l">Total active tasks:</span><span class="r">${response.all_active_tasks}</span>
                        <span class="l">Total on hold tasks:</span><span class="r">${response.all_hold_tasks}</span>
                        <span class="l">To be invoiced:</span><span class="r">${response.to_be_invoiced}</span>`
            };
            canvas += `</div>`
            render(canvas, false);
        }
        else {show_message('Unknown error'); render("Error occurred")}
    })
    .catch(error => {show_message(error)})
}

function report_query(hist=true) {
    if (hist) {history.pushState({"where": "report_query"}, "", "/reports")};

    canvas = '';
    canvas += `<h2>Activity Report</h2>`;
    canvas += `<div class="grid-2"><span class="l">Date from:</span><input id="from" type="date">`;
    canvas += `<span class="l">Date to:</span><input id="to" type="date"></div>`;
    canvas += `<button class="button" onclick="fetch_report()">Get report</button>`;
    render(canvas);
    // Apply current date to "to" field, and current date minus a month to "from" date
    function make2Digits(n) {
        return n.toString().padStart(2, '0');
      }
    date = new Date();
    to = [date.getFullYear(),make2Digits(date.getMonth() + 1),make2Digits(date.getDate())].join('-');
    from = [date.getFullYear(),make2Digits(date.getMonth()),make2Digits(date.getDate())].join('-');
    document.getElementById("to").value = to;
    document.getElementById("from").value = from;
}

function fetch_report(from='', to='', user='') {
    if (from == '') {from = document.getElementById("from").value;};
    if (to == '') {to = document.getElementById("to").value;};
    fetch("/report",{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({"to": to, "from": from, "user": user}),
        mode: 'same-origin' // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(response => {
        if (response['status'] == 'failed') {show_message('Failed: ' + response['error'])}
        else if (response['status'] == 'success') {render_report(response)}
        else show_message('Unknown error');
    })
    .catch(error => {show_message(error)})
}

function render_report(response, hist=true) {
    if (hist) {history.pushState({"where": "render_report", "data": response}, "", "/reports")};
    // Get rid of null value
    if (!response.total_distance) {response.total_distance = 0}

    // Parse times
    labour_time = '';
    travel_time = '';
    // Get rid of null values
    if (!response.total_labour) {t = 0}else{t = parseInt(response.total_labour)}
    // Parse times
    if (t > 59) {
        labour_time = (Math.floor(t / 60)) + " hours " + (t - (Math.floor((t / 60)) * 60)) + " minutes";
    }else{labour_time = t + " minutes"};
    // Get rid of null values
    if (!response.total_travel_time) {t = 0}else{t = parseInt(response.total_travel_time)}
    if (t > 59) {
        travel_time = (Math.floor(t / 60)) + " hours " + (t - (Math.floor((t / 60)) * 60)) + " minutes";
    }else{travel_time = t + " minutes"};


    canvas = '<h2>Activity Report</h2>';
    canvas += `<div><h3>Report from ${response.from} to ${response.to}:</h3></div>`;
    if (response.user != '') {canvas += `<div><h4>For user ${response.user}</h4></div><div class=grid-2>`}
    else{canvas += `<div class="grid-2"><span class="l">Total new tasks created:</span><span class="r">${response.new_tasks}</span>`}
    canvas += `<span class="l">Total tasks resolved:</span><span class="r">${response.resolved_tasks}</span>`;
    canvas += `<span class="l">Total labour time:</span><span class="r">${labour_time}</span>`;
    canvas += `<span class="l">Total travel time:</span><span class="r">${travel_time}</span>`;
    canvas += `<span class="l">Total distance traveled:</span><span class="r">${response.total_distance} km</span>`
    canvas += `</div>`;
    
    // If user is service controller, render user select box
    if (usertype <= 1) {
        canvas += `<h3>Get report per user:<h3>`;
        canvas += `<select id="user" class="select"><option selected disabled>Select user</option>`;
        for (u in response.users) {
            if (response.users[u] != 'admin') {
                canvas += `<option>${response.users[u]}</option>`;
            }
        }
        canvas += `</select>`;
    }
    render(canvas);
    // Event listener for user select box
    if (usertype <= 1) {
        document.getElementById("user").addEventListener("change", () => {
        fetch_report(response.from, response.to, document.getElementById("user").value)
        })
    }
}

function get_users(id=-1) {
    url = "/modify_users?id=" + id;
    fetch(url)
    .then(response => response.json())
    .then(response => {
        if (response.status == "success") {
            if (response.users) {
                render_modify_users(response)
            }else{
                render_user(response)
            }
        }
        else {show_message("Error: " + response.error)}
    })
    .catch(error => {show_message(error, "darkred")});
}

function modify_user(id) {
    if (document.getElementById("is_active")) {
        is_active = document.getElementById("is_active").checked;
        if (document.getElementById(0).checked) {t = 0};
        if (document.getElementById(1).checked) {t = 1};
        if (document.getElementById(2).checked) {t = 2};
    }else{is_active = pw_changed = type = -1}
    fetch("/modify_users",{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            "id": id,
            "is_active": is_active,
            "type": t
        }),
        mode: 'same-origin' // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(response => {
        if (response.status == "success") {
            show_message(response.message, "darkgreen")
            get_users()
        }else{
            show_message(response.error, "darkred")
        }
    })
    .catch(error => {show_message(error, "darkred")})
}

function render_modify_users(response, hist=true) {
    if (hist) {history.pushState({"where": "render_modify_users", "data": response}, "", "/users")};
    canvas = '<h2>Modify User</h2>';
    canvas += `<select id="user" class="select"><option selected disabled>Select user</option>`;
        for (u in response.users) {
            if (response.users[u] != 'admin') {
                canvas += `<option value="${u}">${response.users[u]}</option>`;
            }
        }
    canvas += `</select>`;
    render(canvas);
    // Add event listener for select element
    document.getElementById("user").addEventListener("change", () => {
        get_users(document.getElementById("user").value)
    })
}

function render_user(response, hist=true) {
    if (hist) {history.pushState({"where": "render_user", "data": response}, "", "/users")};
    canvas = '<h2>Modify User</h2>';
    canvas += `<h3>${response.name}</h3>`;
    canvas += `<div class="grid-2">`;
    canvas += `<span class="l">User is enabled:</span><input class="checkbox" id="is_active" type="checkbox">`;
    canvas += `</div>`;
    canvas += `<h4>User type:</h4><div class="grid-2">
                <input id="0" type="radio" name="type" value="0">
                <label class="r" for="0">Administrator</label>
                <input id="1" type="radio" name="type" value="1">
                <label class="r" for="1">Service controller</label>
                <input id="2" type="radio" name="type" value="2">
                <label class="r" for="2">Technician</label></div>`;
    canvas += `<button class="button" onclick="modify_user(${response.id})">Save</button>`
    render(canvas);
    // Populate:
    document.getElementById("is_active").checked = response.is_active;
    document.getElementById(response.type).checked = true;

}