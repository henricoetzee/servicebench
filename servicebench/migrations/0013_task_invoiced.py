# Generated by Django 4.0.6 on 2022-09-15 19:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('servicebench', '0012_alter_task_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='invoiced',
            field=models.BooleanField(default=False),
        ),
    ]
