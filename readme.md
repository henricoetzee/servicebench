# Service Bench
#### My final project for CS50W
This app is made to be used by a small IT support company to keep track of tasks and customers

### Distinctiveness and Complexity

I believe this app is very distinct from any of the other CS50W projects. This is not a e-commerce, social media or online ordering website, but a site that is supposed to be used by a IT support company's emloyees to keep track of the tasks for their customers.

In my view it is more complex than any other CS50W projects.
- Django models are used in a much more complex way.
  - Task and Customer models can be searched.
  - Tasks can be filtered with select elements to do long OR filters
  - Reports can be retreived for a custom timeframe to get technician activity, including total labour time, travel time and distance traveled.
  - Two user types (service controllers and technicians) with server side permission checking to make sure that technicians doesn't modify stuff that they are not supposed to.
- Javascript
  - Implemented forward and back buttons on the Javascript pages
  - Auto and manually hiding sidebar
  - Automatically hiding elements that technicians shouldn't see
  - Disabling certain buttons when they are not needed.

### Files in this project

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

To run the app with a new database, delete the db.sqlite3 file, and all files (exept __init__.py and folder __pycache__) in /servicebench/migrations. Then create new database:
```
python manage.py makemigrations servicebench
python manage.py migrate
python createsuperuser
```
You will then be prompted to create a superuser name and password. Then you can run with:
```
python manage.py runserver
```

### How to use this web app



