// app_tasks.js - Functions used for tasks

// Function to render Task list view
function render_task_list(response, hist=true) {
    if (hist) {history.pushState({"where": "render_task_list", "data": response}, "", "/tasks")};
    page = parseInt(response['page']);
    num_pages = parseInt(response['num_pages']);
    canvas = '<h2>Task list:</h2>';
    // Render filter options
    canvas += `<div><select id="task_status" class="select"><option default value="all">Active tasks</option><option value="n">New tasks</option><option value="s">Started tasks</option><option value="h">On hold tasks</option><option value="r">Resolved tasks</option></select>
                <select id="task_type" class="select"><option default value="all">All types</option><option value="f">Field tasks</option><option value="w">Workshop tasks</option><option value="r">Remote tasks</option></select>
                <select id="task_order" class="select"><option default value="0">Newest first</option><option value="1">Oldest first</option></select>
                <input type="text" id="customer_number" placeholder="Customer number" class="text-box-narrow filter-text">
                <input type="text" id="text" placeholder="Filter text" class="text-box-narrow filter-text">
                <button class="button" onclick="task_query()">Clear filters</button></div>`
    // Render table
    canvas += `<table class="customer-table"><thead><tr><th>Customer name</th><th>Status</th><th>Task age</th><th class="cell-hide-smaller">Contact</th><th class="cell-hide-smaller">Tel</th><th class="cell-hide-small">Problem</th></tr></thead><tbody>`;
    response['tasks'].forEach(task => {
        log_time = new Date(task.log_time).toLocaleString('en-ZA', {timeZone: 'Africa/Johannesburg'});
        task_age = SecToStr(task.age);
        task_status = (task.status == 'n') && 'New' || (task.status == 's') && 'Started' || (task.status == 'h') && 'Hold' || 'Resolved';
        canvas += `<tr onclick="task_query(${task.id})"><td>${task.customer_name}</td><td>${task_status}</td><td>${task_age}</td><td class="cell-hide-smaller">${task.contact}</td><td class="cell-hide-smaller">${task.tel}</td><td class="cell-hide-small">${truncate(task.problem, 40)}</td></tr>`
    })
    canvas += '</tbody></table>';
    canvas += `<div class="pages">`
    if (page > 1) {canvas += `<a href="javascript:task_filter_query(${page-1})">&lt</a>`}
    canvas += `Page ${response['page']} of ${response['num_pages']}`
    if (num_pages > page) {canvas += `<a href="javascript:task_filter_query(${page+1})">&gt</a>`}
    canvas += `</div>`
    render(canvas);
    
    // Add "To be invoiced" option to task status filter if usertype == 1
    if (usertype <= 1) {
        s = document.getElementById("task_status");
        o = document.createElement("option");
        o.text = "To be invoiced";
        o.value = "tbi";
        s.add(o);
    }

    // Populate filters
    if (response.filters) {
        for (i in response.filters) {
            document.getElementById(i).value = response.filters[i];
        }
        if (document.getElementById("customer_number").value == -1) {document.getElementById("customer_number").value = ''};
        if (document.getElementById("text").value == '-') {document.getElementById("text").value = ''};
    }
    // Event listener for filters
    document.querySelectorAll(".select").forEach(item => {
        item.addEventListener("change", () => {
            task_filter_query();
        });
    });
    // Listener for customer number text box
    document.querySelectorAll(".filter-text").forEach(item => {
        item.addEventListener("keydown", (key) => {
            if (key.key == "Enter") {
                task_filter_query();
            }
        })
    })
}

// Function to render single task view
function render_task(task, hist=true) {
    if (hist) {history.pushState({"where": "render_task", "data": task}, "", "/tasks")};
    task_type = (task.type == 'f') && "field" || (task.type == 'w') && "workshop" || "remote";
    task_status = (task.status == 'n') && 'New' || (task.status == 's') && 'Started' || (task.status == 'h') && 'Hold' || 'Resolved';
    log_time = new Date(task.log_time).toLocaleString('en-ZA', {timeZone: 'Africa/Johannesburg'});
    task_age = SecToStr(task.age);
    canvas = '<h2>Task:</h2>';
    canvas += `<div style="font-size:larger">Status: ${task_status}</div>`;
    canvas += `<div style="font-size:smaller">id: ${task.id}</div>`
    canvas += `Task age: ${task_age}`;
    canvas += `<div><input readonly class="text-box" id="customer_name" placeholder="Customer name" value="${task.customer_name}"></div>`;
    canvas += `<div><input readonly class="text-box" id="tel" placeholder="Tel" value="${task.tel}"></div>`;
    canvas += `<div><input readonly class="text-box" id="contact" placeholder="Contact" value="${task.contact}"></div>`;
    canvas += `<div><textarea readonly class="textarea" id="problem" placeholder="Problem">${task.problem}</textarea></div>`;
    if (task.status == 'h') {
        canvas += `<div>Hold reason:</div><div><textarea class="textarea" readonly>${task.hold_reason}</textarea></div>`
    };
    if (task.status == 'r') {
        canvas += `<div>Resolution:</div><div><textarea class="textarea" readonly>${task.resolution}</textarea></div>`;
        canvas += `<div>This was a ${task_type} task.</div>`;
        canvas += `<div>Task completed by ${task.accept_user}</div>`
        canvas += `<div class="grid-2"><span class="l">Labour time:</span><span class="r">${task.labour_time} minutes</span>`;
        canvas += `<span class="l">Travel time:</span><span class="r">${task.travel_time} minutes</span>`;
        canvas += `<span class="l">Travel distance:</span><span class="r">${task.travel_distance} km</span></div>`;
        if (!task.invoiced && usertype <= 1) {
            canvas += `<div>Have you invoiced the customer:</div><button class="button" onclick="modify_task(${task.id},'invoiced')">Yes</button>`;
        };
        
    }else{
        canvas += `<div>This is a ${task_type} task.</div>`;
        if (task.accept_user != "") {
            canvas += `<div>Task accepted by: ${task.accept_user}</div>`
        };
    };
    // If task is new, render Accept button
    if (task.status == 'n') {canvas += `<div><button onClick="modify_task(${task.id},'accept')" class="button">Accept task</button></div>`;};
    // If task is started and belongs to logged in user, render Hold and Resolve buttons
    if (task.status == 's' && task.accept_user == username) {
        canvas += `<div><button onClick="render_hold(${task.id})" class="button">Hold task</button></div>`;
        canvas += `<div><button onClick="render_resolve(${task.id})" class="button">Resolve task</button></div>`;
    };
    // If task is Hold, render Resume button
    if (task.status == 'h' && task.accept_user == username) {canvas += `<div><button onClick="modify_task(${task.id},'resume')" class="button">Resume task</button></div>`};
    render(canvas)
}

function render_hold(id, hist=true) {
    if (hist) {history.pushState({"where": "render_hold", "data": id}, "", "/tasks")};
    canvas = '';
    canvas += `<div><textarea class="textarea" id="reason" placeholder="Please provide reason to put task on hold"></textarea></div>`;
    canvas += `<div><button class="button" onclick="modify_task(${id},'hold')">Hold</button>`;
    render(canvas);
}

function render_resolve(id, hist=true) {
    if (hist) {history.pushState({"where": "render_resolve", "data": id}, "", "/tasks")};
    canvas = '';
    canvas += `<div class="grid-2"><span class="l">Labour time: (minutes)</span><input id="labour" class="num-box" type="number" value="0">`;
    canvas += `<span class="l">Travel time: (minutes)</span><input id="travel" class="num-box" type="number" value="0">`;
    canvas += `<span class="l">Distance traveled: (km)</span><input id="distance" class="num-box" type="number" value="0"></div>`;
    canvas += `<div><textarea class="textarea" id="resolution" placeholder="Please provide the resolution for this task"></textarea></div>`;
    canvas += `<div><button class="button" onclick="modify_task(${id},'resolve')">Resolve</button>`;
    render(canvas);
}

function modify_task(id, job) {
    url = '';
    if (job == 'accept') {data = JSON.stringify({"id": id, "job": "accept"})};
    if (job == 'hold') {
        if (document.getElementById("reason").value == "") {show_message("Please provide reason", "darkred"), render_hold(id); return false;}
        data = JSON.stringify({"id": id, "job": "hold", "reason": document.getElementById("reason").value})};
    if (job == 'resolve') {
        if (document.getElementById("resolution").value == "") {show_message("Please provide a resolution", "darkred"), render_resolve(id); return false;}
        data = JSON.stringify({"id": id,
                                "job": "resolve",
                                "resolution": document.getElementById("resolution").value,
                                "labour": document.getElementById("labour").value,
                                "travel": document.getElementById("travel").value,
                                "distance": document.getElementById("distance").value
                            })};
    if (job == 'resume') {data = JSON.stringify({"id": id, "job":"resume"})};
    if (job == 'invoiced') {data = JSON.stringify({"id": id, "job":"invoiced"})};
    fetch('/modify_task', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: data,
        mode: 'same-origin' // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(response => {
        if (response['status'] == 'success') {
            if (job == 'resolve' | job == 'invoiced') {task_query()}
            else{render_task(response['task'])}
        }
        else {render(response['error'])}    
    })
    .catch(error => {show_message(error); render("Network error occurred")})

}

// Function to get filters from task list view, create filter list and call task_query function
function task_filter_query(page=1) {
    filters = '';
    // Get select items values
    document.querySelectorAll(".select").forEach(item => {
        filters += item.id + "=" + item.value + "&";
    });
    // Get customer number
    customer_number = document.getElementById("customer_number").value;
    if (customer_number == '') {customer_number='-1'};
    // Get text filter
    text_filter = document.getElementById("text").value;
    if (text_filter == '') {text_filter='-'};
    filters += "customer_number=" + customer_number + "&text=" + text_filter;
    task_query(-1, filters, page);
}

// Function to get task info. If filter is not specified, task number is used. Will get all tasks if no customer number is specified.
// Will call render task if task id is specified, else it will call render_task_list
// Filters are used like a get request, eg. filter=true&customer=name&status=n&type=f
function task_query(task=-1, filters='', page=1) {
    render("Fetching info...")
    url = '/query_task?page=' + page + '&';
    if (filters != '') {url += filters}
    else {url += "t=" + task}
    fetch(url)
    .then(response => response.json())
    .then(response => {
        if (response['status'] == 'failed') {show_message('Failed: ' + response['error']); render("Error occurred")}
        else if (response['status'] == 'success') {
            if (task > -1) {render_task(response['task'])}
            else {render_task_list(response)}
        }
        else {show_message('Unknown error'); render("Error occurred")}
    })
    .catch(error => {show_message(error); render("Network error occurred")})
}

// Function to render create task view
function create_task_view(id, hist=true) {
    if (hist) {history.pushState({"where": "create_task_view", "data": id}, "", "/tasks")};
    render("Loading view");
    fetch("/query_customer?c=" + id)
    .then(response => response.json())
    .then(response => {
        if (response['status'] == 'failed') {show_message('Failed: ' + response['error']); render("Error occurred")}
        else if (response['status'] == 'success') {
            customer = response['customer']
            canvas = '<h2>Create a task:</h2>';
            canvas += `<div><input type="hidden" id="id" value=${id}></div>`;
            canvas += `<div>Create a new task for <b>${customer.name}</b>.<br>Contact info can be customized for the task:</div>`;
            canvas += `<div><input class="text-box" id="tel" placeholder="Telephone number" value="${customer['tel']}"></div>`;
            canvas += `<div><input class="text-box" id="contact" placeholder="Contact person" value="${customer['contact']}"></div>`;
            canvas += `<div><textarea class="textarea" id="problem" placeholder="Problem description"></textarea></div>`;
            canvas += `<div><span class="label">Task type:</span><select id="type" class="select"><option value="f">Field</option><option value="w">Workshop</option><option value="r">Remote</option></select></div>`;
            canvas += `<div><button class="button" onclick="create_task()">Create task</button></div>`;
            render(canvas);
        }
        else {show_message('Unknown error'); render("Error occurred")}
    })
    .catch(error => {show_message(error); render("Network error occurred")})
}

// Function to create task. Called by create_task_view
function create_task() {
    id = document.getElementById("id").value;
    tel = document.getElementById("tel").value;
    contact = document.getElementById("contact").value;
    problem = document.getElementById("problem").value;
    type = document.getElementById("type").value;
    fetch("/create_task",{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({"id": id, "tel": tel, "contact": contact, "problem": problem, "type": type}),
        mode: 'same-origin' // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(response => {
        if (response['status'] == 'failed') {show_message('Failed: ' + response['error'])}
        else if (response['status'] == 'success') {show_message(response['message'], 'green'); task_query(response['id'])}
        else show_message('Unknown error');
    })
    .catch(error => {show_message(error)})
}