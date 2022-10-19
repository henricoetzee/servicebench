// Function to get Customer info. If filter is not specified, customer number is used. Will get all customers if no customer number is specified.
// Will call render_customer if customer ID is specified, else it will call render_customer_list
// Filter is a string that is searched through all customer info.
function customer_query(customer=-1, page=1, filter='') {
    render("Fetching info...")
    url = '/query_customer?page=' + page;
    if (filter != '') {url += "&f=" + filter}
    else {url += "&c=" + customer}
    fetch(url)
    .then(response => response.json())
    .then(response => {
        if (response['status'] == 'failed') {show_message('Failed: ' + response['error']); render("Error occurred")}
        else if (response['status'] == 'success') {
            if (customer > -1) {render_customer(response)}
            else {render_customer_list(response)}
        }
        else {show_message('Unknown error'); render("Error occurred")}
    })
    .catch(error => {show_message(error); render("Network error occurred")})
}

// Function to render a list of customers
function render_customer_list(response, hist=true) {
    if (hist) {history.pushState({"where": "render_customer_list", "data": response}, "", "/customers")};
    page = parseInt(response['page'])
    num_pages = parseInt(response['num_pages'])
    canvas = '<h2>Customers:</h2>';
    if (response.filter) {f = response['filter']}else{f = ''};
    canvas += `<div><input id="filter" class="text-box" style="margin-left:15px;width:150px" placeholder="Filter customers"><button class="button" onClick="customer_query()">Clear</buton>
                <button type="button" class="button" onclick="new_customer_view()">Add customer</button><div>
                <table class="customer-table"><thead><tr><th>Customer name</th><th class="cell-hide-smaller">Telephone</th><th class="cell-hide-smaller">Contact person</th></tr></thead>`;
    response['customers'].forEach(customer => {
        canvas += `<tr onclick="javascript:customer_query(${customer.id})"><td>${customer.name}</td><td class="cell-hide-smaller">${customer.tel}</td><td class="cell-hide-smaller">${customer.contact}</td></tr>`
    })
    canvas += '</table>';
    canvas += `<div class="pages">`
    // Render page buttons
    if (f == 'Filter customers') {f = ''}
    if (page > 1) {canvas += `<a href="javascript:customer_query(-1,${page-1},'${f}')">&lt</a>`}
    canvas += `Page ${response['page']} of ${response['num_pages']}`
    if (num_pages > page) {canvas += `<a href="javascript:customer_query(-1,${page+1},'${f}')">&gt</a>`}
    canvas += `</div>`
    render(canvas);
    document.getElementById("filter").value = f;
    document.getElementById("filter").addEventListener("keydown", (key) => {
        value = document.getElementById("filter").value;
        if (key.key == "Enter") {
            customer_query(-1,1,value);
        }
    })
}

// Function to render single customer's info
function render_customer(request, hist=true) {
    if (hist) {history.pushState({"where": "render_customer", "data": request}, "", "/customers")};
    customer = request.customer;
    canvas = '<h2>Customer info:</h2>';
    canvas += `<div>Customer number: ${customer.id}</div>`
    canvas += `<div><input class="text-box c-input" id="c_name" placeholder="Customer name" value="${customer['name']}"></div>`;
    canvas += `<div><textarea class="textarea c-input" id="c_address" placeholder="Address">${customer['address']}</textarea></div>`;
    canvas += `<div><input class="text-box c-input" id="c_tel" placeholder="Telephone number" value="${customer['tel']}"></div>`;
    canvas += `<div><input class="text-box c-input" id="c_contact" placeholder="Contact person" value="${customer['contact']}"></div>`;
    canvas += `<div><button disabled id="save_button" onclick="save_customer(${customer['id']})" class="button-disabled">Save changes</button>`;
    canvas += `<button onclick="create_task_view(${customer['id']})" class="button">Create task</button>`;
    canvas += `<div><button disabled id="at_button" onclick="task_query('-1','task_status=all&task_type=all&task_order=0&customer_number=${customer.id}&text=-')" class="button-disabled">Active tasks</button>`
    canvas += `<button disabled id="rt_button" onclick="task_query('-1','task_status=r&task_type=all&task_order=0&customer_number=${customer.id}&text=-')" class="button-disabled">Resolved tasks</button></div>`
    render(canvas);
    // Update task buttons
    at_button = document.getElementById("at_button");
    rt_button = document.getElementById("rt_button");
    if (request.active_tasks > 0) {
        at_button.className = "button";
        at_button.disabled = false;
        at_button.innerHTML = `Active Tasks (${request.active_tasks})`
    };
    if (request.resolved_tasks > 0) {
        rt_button.className = "button";
        rt_button.disabled = false;
        rt_button.innerHTML = `Resolved Tasks (${request.resolved_tasks})`
    };
    // Check if data is changed:
    save_button = document.getElementById("save_button");
    document.querySelectorAll(".c-input").forEach(element => {
        element.addEventListener("input", () => {
            if (document.getElementById("c_name").value != customer.name
                || document.getElementById("c_address").value != customer.address
                || document.getElementById("c_tel").value != customer.tel
                || document.getElementById("c_contact").value != customer.contact) {
                save_button.className = "button";
                save_button.disabled = false;
            }else{
                save_button.className = "button-disabled";
                save_button.disabled = true;
            };
        });
    });
}


// Function to render New Customer view
function new_customer_view(hist=true) {
    if (hist) {history.pushState({"where": "new_customer_view", "data": ""}, "", "/customers")};
    canvas = '<h2>Create new customer:</h2>';
    canvas += '<div><input class="text-box" autofocus id="c_name" placeholder="Customer name"></div>';
    canvas += '<div><textarea class="textarea" id="c_address" placeholder="Address"></textarea></div>';
    canvas += '<div><input class="text-box" id="c_tel" placeholder="Telephone number"></div>';
    canvas += '<div><input class="text-box" id="c_contact" placeholder="Contact person"></div>';
    canvas += '<div><button class="button" onclick="add_customer()">Add customer</button></div>';
    render(canvas);
}

// Function to add a customer. Called by new_customer_view
function add_customer() {
    c_name = document.getElementById("c_name").value;
    c_address = document.getElementById("c_address").value;
    c_tel = document.getElementById("c_tel").value;
    c_contact = document.getElementById("c_contact").value;
    fetch("/create_customer",{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({"name": c_name, "address": c_address, "tel": c_tel, "contact": c_contact}),
        mode: 'same-origin' // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(response => {
        if (response['status'] == 'failed') {show_message('Failed: ' + response['error'])}
        else if (response['status'] == 'success') {show_message(response['message'], 'green'); customer_query(response['id'])}
        else show_message('Unknown error');
    })
    .catch(error => {show_message(error)})
}

// Function to save changes to customer
function save_customer(id) {
    c_name = document.getElementById("c_name").value;
    c_address = document.getElementById("c_address").value;
    c_tel = document.getElementById("c_tel").value;
    c_contact = document.getElementById("c_contact").value;
    fetch("/save_customer",{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({"id": id, "name": c_name, "address": c_address, "tel": c_tel, "contact": c_contact}),
        mode: 'same-origin' // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(response => {
        if (response['status'] == 'failed') {
            show_message('Failed: ' + response['error']);
            customer_query(id);
        }
        else if (response['status'] == 'success') {
            show_message(response['message'], 'green');
            customer_query(id);
        }
        else show_message('Unknown error');
    })
    .catch(error => {show_message(error)})
}
