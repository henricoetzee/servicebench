# Service Bench
#### My final project for CS50W
This app is made to be used by a small IT support company to keep track of tasks and customers.

### Distinctiveness and Complexity

I believe this app is very distinct from any of the other CS50W projects. This is not a e-commerce, social media or online ordering website, but a site that is supposed to be used by a IT support company's emloyees to keep track of the tasks for their customers.

In my view it is more complex than any other CS50W projects:
- Django models are used in a much more complex way:
  - Task and Customer models can be searched
  - Tasks can be filtered with select elements to do long OR filters
  - Reports can be retreived for a custom timeframe to get technician activity, including total labour time, travel time and distance traveled.
  - Three user types (administrators, service controllers and technicians) with server side permission checking to make sure that users doesn't modify stuff that they are not supposed to
- Javascript:
  - Implemented forward and back buttons on the Javascript pages
  - Auto and manually hiding sidebar
  - Automatically hiding elements that technicians shouldn't see
  - Disabling certain buttons when they are not needed

### Files in this project

These are the files in the project that is not a default Django file:
```
./db.sqlite3             Test database (See below how to remove if you want to start without data)
./readme.md              This file!
./requirements.txt       Required Python packages
./servicebench/
    models.py            Django models (User, Customer, Task)
    urls.py              URL declarations
    views.py             Python server functions
./servicebench/static/
    *.png                Icon files
    favicon.ico          Icon file
    site.webmanifest     Icon file
    css.css              All of the CSS for this site
    main.js              Javascript functions
    app.js               Javascript functions used by report and dashboard 
    app_customers.js     Javascript functions used by the customer part of the site
    app_tasks.js         Javascript functions used by the tasks part of the site
./servicebench/templates
    change_password.html Page to change password
    create_user.html     Page to create a user
    index.html           Welcome page - Also the page where all the javascript rendering takes place
    login.html           Login page
    template.html        Template used by other HTML files
```
### Running app

To run this app, you will need Python. You will also need to install Django: (make sure pip is also installed with Python)
```
pip3 install django
```
There is already a database present in the app filled with bogus info for testing. To run the app with the current database, simply run:
```
python manage.py runserver
```
The admin user's password is admin and all the other user's passwords are qwer

To run the app with a new database, delete the db.sqlite3 file, and all files (exept \_\_init\_\_.py and folder \_\_pycache\_\_) in /servicebench/migrations. Then create new database:
```
python manage.py makemigrations servicebench
python manage.py migrate
python manage.py createsuperuser
```
You will then be prompted to create a superuser name and password. Please use admin for superuser name. This is hardcoded in some functions. Then you can run with:
```
python manage.py runserver
```

### How to use this web app

#### Users

When you first log in to the app, you will be asked to change your password.

When logging in with admin (or other admin users) you will be able to create and modify users. Users are not able to register on their own and need to ask their supervisors to create an account. There are 3 user types that can be assigned to a user:
1. Technician has the least amount of permissions and can only see New tasks, their own accepted tasks, and their own activity report. 
2. Service controllers can create and modify customers, create tasks for customers, and see and accept all tasks. They can also see Activity reports for all users.
3. Administrators can do all of that and also create and modify users.
The admin user created when installing the app can also visit the Django admin site. When admin is logged in, a link to the admin site is added to the sidebar.
Go to Create user on the left to create users with a tempory password and choose the relevant user type. After the user logs in, they will be asked to change their password.

#### Customers

Go to Customers on the sidebar to view a list of customers. On top is a filter box to search through all customer fields. Next to that is a Add Customer button. Clicking on that you will be taken to a form. Click Add Customer after filling in everything to be taken to the customer page. Here you can modify customer info and create tasks by clicking the relevant buttons on the bottom.

#### Tasks

Tasks has 3 types: Workshop, Field and Remote.  They relate to how the technician will do the task.
To create tasks, go to the customer's page and click Create task. You will be prompted for a problem description and task type. You can also modify contact number and contact person. This will be task specific and will not modify the customer. Click on Create task to create the task. The task type will be "new".

When clicking on tasks in the sidebar, you will be shown a table of Active tasks. Resolved tasks are hidden, but can be shown by using the filters above the list. If your user type is technician, you will only be able to see your own tasks and new tasks. There are filter on the top of the table to filter tasks:
- Task status
- Task type
- Sort order (newest or oldest first)
- Customer number (can be seen on customer page)
- Text search (search through all task fields)

Click on a task to view the task page. Here, new tasks can be accepted by clicking on Accept task. Task status will now be "started" with the logged in user as the accepted user.

Now the task page will have 2 new buttons. One for Hold task and one for Resolve task. If the task cannot be resolved now it can be placed on hold. Click on Hold task to place the task on hold. You will be prompted for a reason why the task should be on hold. The task status will be "hold".

The task page will now have a Resume button. Click that to change the task back to "started"

Click on the Resolve button on the task page to resolve a task. You will be prompted for labour time, travel time and travel distance.

After resolving tasks, the customer needs to be invoices. In the task list view, you can filter to only see tasks that need to invoiced. Clicking on such a task you will see the task page where you can confirm that the customer was invoiced.

#### Activity Report

Click on Activity Report will ask you for a "from and "to" dates for the report. Default will be for the last month, but you can select your own range.

Click on Get Report to be taken to a page that will display these values if you are an administrator or service controller:
- Total new tasks created
- Total tasks resolved
- Total labour time
- Total travel time
- Total distance traveled

Technicians will be taken to a page that displays their own data. Service controllers and administrators can view specific user data by selecting a user at the bottom of the view. These values will be displayed:
- Total tasks resolved
- Total labour time
- Total travel time
- Total distance traveled

