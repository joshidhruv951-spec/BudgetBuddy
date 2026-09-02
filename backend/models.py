from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default='INR')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


class Income(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incomes')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    income_type = models.CharField(max_length=50)
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)


class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50)
    description = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)


class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50)
    transaction_type = models.CharField(max_length=20, choices=[('INCOME', 'Income'), ('EXPENSE', 'Expense')], default='EXPENSE')
    description = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)


class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=50)
    allocated_amount = models.DecimalField(max_digits=12, decimal_places=2)
    month = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)


class SavingsGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='savings_goals')
    goal_name = models.CharField(max_length=100)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    target_date = models.DateField(null=True, blank=True)


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Report(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    title = models.CharField(max_length=100)
    summary_data = models.JSONField(default=dict)
    generated_at = models.DateTimeField(auto_now_add=True)