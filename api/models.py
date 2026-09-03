from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

# ==========================================
# 1. EXPENSE CATEGORIES (Strictly 6 Choices)
# ==========================================
EXPENSE_CATEGORIES = [
    ('Food', 'Food'),
    ('Travel', 'Travel'),
    ('Shopping', 'Shopping'),
    ('Education', 'Education'),
    ('Entertainment', 'Entertainment'),
    ('Miscellaneous', 'Miscellaneous'),
]

class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} | {self.title} - ₹{self.amount} ({self.category})"


# ==========================================
# 2. INCOME SOURCES (Strictly 3 Choices)
# ==========================================
INCOME_SOURCES = [
    ('Pocket Money', 'Pocket Money'),
    ('Scholarship', 'Scholarship'),
    ('Freelance Income', 'Freelance Income'),
]

class Income(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incomes')
    source = models.CharField(max_length=50, choices=INCOME_SOURCES)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    date = models.DateField()
    details = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} | {self.source} - ₹{self.amount}"


# ==========================================
# 3. BUDGET CREATION & CATEGORY ALLOCATION
# ==========================================
class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    month = models.PositiveIntegerField()  # 1 to 12
    year = models.PositiveIntegerField()   # e.g., 2026
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'month', 'year')

    def __str__(self):
        return f"{self.user.username} Budget ({self.month}/{self.year}) - ₹{self.total_amount}"


class CategoryBudget(models.Model):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='category_allocations')
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES)
    allocated_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])

    class Meta:
        unique_together = ('budget', 'category')

    def __str__(self):
        return f"{self.category}: ₹{self.allocated_amount}"