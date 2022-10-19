import datetime
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    # Type: 0 = admin 1 = Service Controller, 2 = Technician
    type = models.IntegerField(default=0)
    # Did user change password after being created?
    pw_changed = models.BooleanField(default=False)

class Customer(models.Model):
    name = models.CharField(max_length=64, unique=True, blank=False)
    address = models.TextField()
    tel = models.CharField(max_length=20)
    contact = models.CharField(max_length=64)
    def __str__(self):
        return self.name
    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "tel": self.tel,
            "contact": self.contact
        }
    def serialize_more(self):
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "tel": self.tel,
            "contact": self.contact
        }

class Task(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="tasks")
    tel = models.CharField(max_length=20)
    contact = models.CharField(max_length=64)
    problem = models.TextField()
    type_choices = [
        ("f", "Field"),
        ("w", "Workshop"),
        ("r", "Remote")
    ]
    type = models.CharField(max_length=1, choices=type_choices)
    status_choices = [
        ("n", "New"),
        ("s", "Started"),
        ("h", "Hold"),
        ("r", "Resolved")
    ]
    status = models.CharField(max_length=1, choices=status_choices, default="n")
    log_time = models.DateTimeField(default=datetime.datetime.now)
    accept_time = models.DateTimeField(null=True)
    accept_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks", null=True)
    hold_reason = models.TextField(blank=True)
    labour_time = models.IntegerField(default=0)
    travel_time = models.IntegerField(default=0)
    travel_distance = models.IntegerField(default=0)
    resolved_time = models.DateTimeField(null=True)
    resolution = models.TextField(blank=True)
    invoiced = models.BooleanField(default=False)
    def serialize(self):
        return {
            "id": self.id,
            "customer_id": self.customer.id,
            "customer_name": self.customer.name,
            "tel": self.tel,
            "contact": self.contact,
            "problem": self.problem,
            "status": self.status,
            "log_time": self.log_time,
            "age": (timezone.now() - self.log_time).total_seconds()
        }
    def serialize_more(self):
        if self.accept_user:
            accept_user = self.accept_user.username
        else:
            accept_user = ''
        return {
            "id": self.id,
            "customer_id": self.customer.id,
            "customer_name": self.customer.name,
            "tel": self.tel,
            "contact": self.contact,
            "problem": self.problem,
            "type": self.type,
            "status": self.status,
            "log_time": self.log_time,
            "accept_time": self.accept_time,
            "accept_user": accept_user,
            "hold_reason": self.hold_reason,
            "labour_time": self.labour_time,
            "travel_time": self.travel_time,
            "travel_distance": self.travel_distance,
            "resolved_time": self.resolved_time,
            "resolution": self.resolution,
            "invoiced": self.invoiced,
            "age": (timezone.now() - self.log_time).total_seconds()
        }