import json
import datetime
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Q, Sum
from django.core.paginator import Paginator
from .models import User, Customer, Task

def index(request):
    return render(request, "index.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def login_view(request):
    if request.method != 'POST':
        return render(request, "login.html")
    try:
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if user.pw_changed == False:
                return render(request, "change_password.html", {"message": "Please change your password"})
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "login.html", {"message": "Invalid username and/or password."})
    except Exception as e:
        return render(request, "login.html", {"message": e})
    return HttpResponseRedirect(reverse("index"))

@login_required
def change_password(request):
    if request.method == 'POST':
        try:
            old_password = request.POST['old_password']
            new_password = request.POST['new_password']
            password_confirm = request.POST['password_confirm']
            if new_password == old_password:
                return render(request, "change_password.html", {"message": "New password should be different than old password"})
            if new_password != password_confirm:
                return render(request, "change_password.html", {"message": "New password doesn't match confirmation"})
            u = User.objects.get(username=request.user.username)
            if u.check_password(old_password):
                try:
                    u.set_password(new_password)
                    u.pw_changed = True
                    u.save()
                except Exception as e:
                    return render(request, "change_password.html", {"message": e})
                logout(request)
                return render(request, "login.html", {"message": "Password changed. Please log in again."})
            else:
                return render(request, "change_password.html", {"message": "Old password is wrong"}) 
        except Exception as e:
            return render(request, "change_password.html", {"message":e})       
    return render(request,"change_password.html" )

@login_required
def create_user(request):
    if request.user.type > 1:
        return render(request, "index.html", {"message": "You do not have permission to access this page"})
    if request.method == 'POST':
        try:
            username = request.POST['username']
            password = request.POST['password']
            password_confirm = request.POST['password_confirm']
            t = request.POST['type']
            if password != password_confirm:
                return render(request, "create_user.html", {"message", "Passwords did not match"})
            try:
                u = User.objects.create_user(username, None, password, type=t)
                u.save()
            except Exception as e:
                return render(request, "create_user.html", {"message":e})
            m = f'User "{username}" created'
            return render(request, "create_user.html", {"message":m})
        except Exception as e:
            return render(request, "create_user.html", {"message":e})   
    return render(request,"create_user.html" )

@login_required
def create_customer(request):
    if request.user.type > 1:
        return JsonResponse({"status": "failed", "error": "Permission denied"})
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            if data['name'] == '':
                return JsonResponse({"status": "failed", "error": "Customer name is required"})
            c = Customer.objects.create(name=data['name'], address=data['address'], tel=data['tel'], contact=data['contact'])
        except IntegrityError:
            return JsonResponse({"status": "failed", "error": "Customer already exists"})
        except Exception as e:
            return JsonResponse({"status": "failed", "error": e})
        return JsonResponse({"status": "success", "message": "Customer added", "customer": c.name, "id": c.id})
    return JsonResponse({"status": "failed", "error": "Request method must be PUT"})

@login_required
def query_customer(request):
    # Check user permission
    if request.user.type > 1:
        return JsonResponse({"status": "failed", "error": "Permission denied"})
    if request.method == 'GET':
        c = -1
        # Get page number
        try:
            page = int(request.GET['page'])
        except:
            page = 1
        try:
            f = request.GET['f']
            if f != '':
                # Return filtered customer list
                try:
                    customers = Customer.objects.filter(Q(name__contains=f) | Q(address__contains=f) | Q(tel__contains=f)| Q(contact__contains=f)).order_by('name')
                    p = Paginator(customers, 10)
                    customers = p.page(page).object_list
                except Exception as e:
                    return JsonResponse({"status": "failed", "error": e})
                return JsonResponse({'status': 'success', 'customers': [c.serialize() for c in customers], 'filter': f, 'page': page, 'num_pages': p.num_pages})
        except:
            pass  # No filters, so pass
        try:
            c = int(request.GET['c'])
        except:
            JsonResponse({"status": "failed", "error": "Specify integer c in GET request"})
        if c == -1:
            # Return all customers
            customers = Customer.objects.all().order_by('name')
            p = Paginator(customers, 10)
            customers = p.page(page).object_list
            return JsonResponse({'status': 'success', 'customers': [c.serialize() for c in customers], 'page': page, 'num_pages': p.num_pages})
        else:
            # Return specific customer
            customer = Customer.objects.get(id=c)
            active_tasks = customer.tasks.all().exclude(status='r').count()
            resolved_tasks = customer.tasks.filter(status='r').count()
            return JsonResponse({'status': 'success',
                                'customer': customer.serialize_more(),
                                'active_tasks': active_tasks,
                                'resolved_tasks': resolved_tasks
                                })
    return JsonResponse({"status": "failed", "error": "Request method must be GET"})

@login_required
def save_customer(request):
    # Check user permission
    if request.user.type > 1:
        return JsonResponse({"status": "failed", "error": "Permission denied"})
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            if data['name'] == '':
                return JsonResponse({"status": "failed", "error": "Customer name is required"})
            c = Customer.objects.get(id=data['id'])
            c.name = data['name']
            c.address = data['address']
            c.tel = data['tel']
            c.contact = data['contact']
            c.save()
        except IntegrityError:
            return JsonResponse({"status": "failed", "error": "Customer already exists"})
        except Exception as e:
            return JsonResponse({"status": "failed", "error": e})
        return JsonResponse({"status": "success", "message": "Customer saved", "customer": c.name, "id": c.id})
    return JsonResponse({"status": "failed", "error": "Request method must be PUT"})

@login_required
def create_task(request):
    # Check user permission
    if request.user.type > 1:
        return JsonResponse({"status": "failed", "error": "Permission denied"})
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            if data['problem'] == '':
                return JsonResponse({"status": "failed", "error": "Problem is required"})
            c = Customer.objects.get(id=data['id'])
            t = Task.objects.create(customer=c, tel=data['tel'], contact=data['contact'], problem=data['problem'], type=data['type'])
        except IntegrityError as i:
            return JsonResponse({"status": "failed", "error": i})
        except Exception as e:
            return JsonResponse({"status": "failed", "error": e})
        return JsonResponse({"status": "success", "message": "Task created", "id": t.id})
    return JsonResponse({"status": "failed", "error": "Request method must be PUT"})

@login_required
def query_task(request):
    if request.method == 'GET':
        t = -1
        # Try to get page number, else use page 1
        try:
            page = int(request.GET["page"])
        except:
            page = 1
        try: # Apply filters if there are:
            filters = {}
            filters["task_status"] = request.GET["task_status"]
            filters["task_type"] = request.GET["task_type"]
            filters["task_order"] = request.GET["task_order"]
            filters["customer_number"] = int(request.GET["customer_number"])
            filters["text"] = f = request.GET["text"]
            if filters["task_status"] != 'all':
                if filters["task_status"] == "tbi": # Get tasks that are "resolved" and "to be invoiced (tbi)"
                    tasks = Task.objects.filter(status='r').exclude(invoiced=True)
                else: # Get tasks with specific status
                    tasks = Task.objects.filter(status=filters["task_status"])
            else: # Get all tasks that are not resolved
                tasks = Task.objects.all().exclude(status='r')
            if filters["task_type"] != 'all':
                tasks = tasks.filter(type=filters["task_type"])
            if filters["task_order"] == '0':
                tasks = tasks.order_by('-id')
            else:
                tasks = tasks.order_by('id')
            if filters["customer_number"] > -1:
                customer = Customer.objects.get(id=filters["customer_number"])
                tasks = tasks.filter(customer=customer)
            if filters["text"] != '-':
                tasks = tasks.filter(Q(customer__name__contains=f) | Q(tel__contains=f) | Q(contact__contains=f) | Q(problem__contains=f) | Q(accept_user__username__contains=f) | Q(hold_reason__contains=f) | Q(resolution__contains=f))
            # Filter only new and own tasks for techs
            if request.user.type > 1:
                tasks = tasks.filter(Q(status='n') | Q(accept_user=request.user.id))
            # Paginate
            p = Paginator(tasks, 10)
            tasks = p.page(page).object_list
            return JsonResponse({'status': 'success', 'tasks': [t.serialize() for t in tasks], 'filters': filters, 'page': page, 'num_pages': p.num_pages})
        except:  
            pass   # No filters, so pass

        try: # Try to get customer number
            t = int(request.GET['t'])
        except:
            JsonResponse({"status": "failed", "error": "Specify integer t in GET request"})
        if t == -1:
            # Return all tasks
            tasks = Task.objects.all().exclude(status='r').order_by('-id')
            # Filter only new and own tasks for techs
            if request.user.type > 1:
                tasks = tasks.filter(Q(status='n') | Q(accept_user=request.user.id))
            # Paginate
            p = Paginator(tasks, 10)
            tasks = p.page(page).object_list
            return JsonResponse({'status': 'success', 'tasks': [t.serialize() for t in tasks], 'page': page, 'num_pages': p.num_pages})
        else:
            # Return specific customer
            task = Task.objects.get(id=t)
            return JsonResponse({'status': 'success', 'task': task.serialize_more()})
    return JsonResponse({"status": "failed", "error": "Request method must be GET"})

@login_required
def modify_task(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            job = data['job']
            print(job)
            task = Task.objects.get(id=data['id'])
            logged_user = User.objects.get(id=request.user.id)
            if job == 'accept':
                if task.status != 'n':
                    return JsonResponse({'status': 'failed', 'error': 'Can only accept new task'})
                task.status = 's'
                task.accept_time = datetime.datetime.now()
                task.accept_user = logged_user
                task.save()
                return JsonResponse({'status': 'success', 'task': task.serialize_more()})
            if job == 'hold':
                # Check permission
                if (task.accept_user != logged_user):
                    return JsonResponse({'status': 'failed', 'error': 'Task belongs to another user'})
                task.status = 'h'
                task.hold_reason = data['reason']
                task.save()
                return JsonResponse({'status': 'success', 'task': task.serialize_more()})
            if job == 'resume':
                # Check permission
                if (task.accept_user != logged_user):
                    return JsonResponse({'status': 'failed', 'error': 'Task belongs to another user'})
                task.status = 's'
                task.save()
                return JsonResponse({'status': 'success', 'task': task.serialize_more()})
            if job == 'resolve':
                # Check permission
                if (task.accept_user != logged_user) and (logged_user.type > 1):
                    return JsonResponse({'status': 'failed', 'error': 'Task belongs to another user'})
                task.resolution = data['resolution']
                task.labour_time = int(data['labour'])
                task.travel_time = int(data['travel'])
                task.travel_distance = int(data['travel'])
                task.resolved_time = datetime.datetime.now()
                task.status = 'r'
                task.save()
                return JsonResponse({'status': 'success'})
            if job == 'invoiced':
                # Check permission
                if (logged_user.type > 1):
                    return JsonResponse({'status': 'failed', 'error': 'You do no have permission to do this'})
                if task.status != 'r':
                    return JsonResponse({'status': 'failed', 'error': 'You can only invoice resolved tasks'})
                task.invoiced = True
                task.save()
                return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({"status": "failed", "error": e})
        return JsonResponse({"status": "failed", "error": "Unknown error"})
    return JsonResponse({"status": "failed", "error": "Request method must be PUT"})

@login_required
def dashboard(request):
    try:
        new_tasks = Task.objects.filter(status='n').count()
        hold_tasks = Task.objects.filter(status='h').filter(accept_user=request.user.id).count()
        active_tasks = Task.objects.filter(status='s').filter(accept_user=request.user.id).count()
        if request.user.type <= 1:
            all_hold_tasks = Task.objects.filter(status='h').count()
            all_active_tasks = Task.objects.filter(status='s').count()
            to_be_invoiced = Task.objects.filter(status='r').filter(invoiced=False).count()
        else:
            all_hold_tasks = all_active_tasks = to_be_invoiced = 0
    except Exception as e:
        return JsonResponse({"status": "failed", "error": e})
    return JsonResponse({"status": "success",
                        "new_tasks": new_tasks,
                        "hold_tasks": hold_tasks,
                        "active_tasks": active_tasks,
                        "all_hold_tasks": all_hold_tasks,
                        "all_active_tasks": all_active_tasks,
                        "to_be_invoiced": to_be_invoiced
                        })

@login_required
def report(request):
    
    if request.method != 'PUT':
        return JsonResponse({"status": "failed", "error": "Request method should be PUT"})
    
    try:
        data = json.loads(request.body)
        date_from = datetime.datetime.strptime(data["from"], "%Y-%m-%d")
        date_to = datetime.datetime.strptime(data["to"], "%Y-%m-%d")
    except:
        return JsonResponse({"status": "failed", "error": "Date error"})
    
    # If user is of type technician, make sure we only return that user's data
    if request.user.type > 1:
        data['user'] = request.user.username
    
    if date_from > date_to:
        return JsonResponse({"status": "failed", "error": "Date error"})
    # Add 1 day to "date_to" because the time of these dates are 00:00
    date_to = date_to + datetime.timedelta(days=1)
    
    # If user is specified, get data for specific user, else get for all users
    if data['user'] != '':
        new_tasks = 0    # New tasks is irrelevant for specific user report
        resolved_tasks_list = Task.objects.filter(resolved_time__gte=date_from).filter(resolved_time__lte=date_to).filter(accept_user__username=data['user'])
    else:
        new_tasks = Task.objects.filter(log_time__gte=date_from).filter(log_time__lte=date_to).count()
        resolved_tasks_list = Task.objects.filter(resolved_time__gte=date_from).filter(resolved_time__lte=date_to)
    
    # Get info from task list
    resolved_tasks = resolved_tasks_list.count()
    total_labour = resolved_tasks_list.aggregate(Sum('labour_time'))
    total_travel_time = resolved_tasks_list.aggregate(Sum('travel_time'))
    total_distance = resolved_tasks_list.aggregate(Sum('travel_distance'))
    
    # Get list of users
    all_users = User.objects.values()
    users = []
    for u in all_users:
        users.append(u['username'])

    return JsonResponse({"status": "success",
                        "from": data["from"],
                        "to": data["to"],
                        "user": data["user"],
                        "new_tasks": new_tasks,
                        "resolved_tasks": resolved_tasks,
                        "total_labour": total_labour["labour_time__sum"],
                        "total_travel_time": total_travel_time["travel_time__sum"],
                        "total_distance": total_distance["travel_distance__sum"],
                        "users": users
                        })

@login_required
def modify_users(request):
    if request.user.type != 0:
        return JsonResponse({"status": "failed", "error": "Permission denied"})
    if request.method == "GET":
        id = int(request.GET['id'])
        if id == -1:    # Return list of users
            all_users = User.objects.values()
            users = {}
            for u in all_users:
                users[u['id']] = u['username']
            return JsonResponse({"status": "success", "users": users})
        else:    # Return specific user info:
            try:
                u = User.objects.get(id=id)
            except Exception as e:
                return JsonResponse({"status": "failed", "error": e})
            return JsonResponse({
                "status": "success",
                "id": u.id,
                "name": u.username,
                "is_active": u.is_active,
                "type": u.type
            })
    if request.method == "PUT":
        data = json.loads(request.body)
        if data['id'] == -1 | data['is_active'] == -1 | data['type'] == -1:
            return JsonResponse({"status": "failed", "error": "Data error"})
        try:
            u = User.objects.get(id=data['id'])
            u.is_active = data['is_active']
            u.type = data['type']
            u.save()
        except Exception as e:
            return JsonResponse({"status": "failed", "error": e})
        return JsonResponse({"status": "success", "message": "User info saved"})
    return JsonResponse({"status": "failed", "error": "Request should be PUT or GET"})