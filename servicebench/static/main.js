//main.js

// Variables used by sidebar_hide functions
small_window = 700;
sidebar_visible = true;

// Function to hide sidebar if window is small
function check_sidebar() {
    if (window.innerWidth <= small_window && sidebar_visible == true) {
        hide_sidebar();
    };
};

// Function to toggle sidebar visibility
function hide_sidebar() {
    sidebar = document.getElementById("sidebar");
    hide_button = document.getElementById("hide_button");
    if (sidebar_visible) {
        sidebar.style.left = "-200px";
        sidebar.style.boxShadow = "none";
        hide_button.style.left = "0px";
        document.getElementById("block").style.marginLeft = "0px";
        document.getElementById("message").style.left = "0px";
        sidebar_visible = false;
    }else{
        sidebar.style.left = "0px";
        sidebar.style.boxShadow = "0 0 15px 0 rgba(0, 0, 0, 0.5)";
        hide_button.style.left = "200px";
        document.getElementById("block").style.marginLeft = "200px";
        document.getElementById("message").style.left = "200px";
        sidebar_visible = true;     
    }

}

// Function to render HTML to #main_body
function render(canvas, overwrite=true) {
    main_body = document.getElementById("main_body");
    if (overwrite) {main_body.innerHTML = ''}
    main_body.innerHTML += canvas;
    check_sidebar();
}

// Get CSRF cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

// Function to show message for 4 seconds
function show_message(message, color="darkgreen") {
    div = document.getElementById("message");
    main_view = document.getElementById("block");
    main_view.style.marginTop = "65px";
    div.style.backgroundColor = color;
    div.innerHTML = message;
    div.style.opacity = 100;
    setTimeout(() => {
        div.style.opacity = 0;
        main_view.style.marginTop = "0px";
    }, 4000);
}

// History
window.onpopstate = function(event) {
    if (event.state.where == 'render_customer_list') {render_customer_list(event.state.data, false)};
    if (event.state.where == 'render_customer') {render_customer(event.state.data, false)};
    if (event.state.where == 'new_customer_view') {new_customer_view(false)};
    if (event.state.where == 'create_task_view') {create_task_view(event.state.data, false)}
    if (event.state.where == 'render_task_list') {render_task_list(event.state.data, false)}
    if (event.state.where == 'render_task') {render_task(event.state.data, false)};
    if (event.state.where == 'render_hold') {render_hold(event.state.data, false)};
    if (event.state.where == 'render_resolve') {render_resolve(event.state.data, false)};
    if (event.state.where == 'report_query') {report_query(false)};
    if (event.state.where == 'render_report') {render_report(event.state.data, false)};
    if (event.state.where == 'render_modify_users') {render_report(event.state.data, false)};
}

// Function to truncate string
function truncate(str, n){
    return (str.length > n) ? str.slice(0, n-1) + '&hellip;' : str;
};

// Function to convert seconds to human readable string
function SecToStr(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);

    var dDisplay = d > 0 ? d + (d == 1 ? " day " : " days ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour " : " hours ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute " : " minutes ") : "";
    return dDisplay + hDisplay + mDisplay;
}