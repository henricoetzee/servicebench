from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    # Aliases for index
    path("tasks", views.index, name="index"),
    path("customers", views.index, name="index"),
    path("reports", views.index, name="index"),
    path("users", views.index, name="index"),
    
    path("logout", views.logout_view, name="logout"),
    path("login", views.login_view, name="login"),
    path("change_password", views.change_password, name="change_password"),
    path("create_user", views.create_user, name="create_user"),

    #API paths:
    path("create_customer", views.create_customer, name="create_customer"), 
    path("query_customer", views.query_customer, name="query_customer"),
    path("save_customer", views.save_customer, name="save_customer"),
    path("create_task", views.create_task, name="create_task"),
    path("query_task", views.query_task, name="query_task"),
    path("modify_task", views.modify_task, name="modify_task"),
    path("dashboard", views.dashboard, name="dashboard"),
    path("report", views.report, name="report"),
    path("modify_users", views.modify_users, name="modify_users")
]