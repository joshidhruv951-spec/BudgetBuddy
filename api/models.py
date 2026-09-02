from django.db import models
from datetime import date  # <--- Import date

class Transaction(models.Model):
    title = models.CharField(max_length=200)
    amount = models.FloatField()
    category = models.CharField(max_length=100)
    transaction_type = models.CharField(max_length=20)
    date = models.DateField(auto_now_add=True)  # <--- Change timezone.now to date.today OR auto_now_add=True