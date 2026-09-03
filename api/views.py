from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Expense, Income, Budget
from .serializers import ExpenseSerializer, IncomeSerializer, BudgetSerializer

# 1. Expense Management ViewSet
class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only logged-in user's expenses
        return Expense.objects.filter(user=self.request.user).order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# 2. Income Management ViewSet (Tasks 1, 2, 3, 4)
class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only logged-in user's incomes
        return Income.objects.filter(user=self.request.user).order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# 3. Budget Management ViewSet
class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only logged-in user's budgets
        return Budget.objects.filter(user=self.request.user).order_by('-year', '-month')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# 4. Milestone 2 Task 5: Dashboard Data & Chronological View
class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        expenses = Expense.objects.filter(user=user)
        incomes = Income.objects.filter(user=user)

        total_income = sum(float(i.amount) for i in incomes)
        total_expense = sum(float(e.amount) for e in expenses)
        remaining_amount = total_income - total_expense

        # Combine Expense & Income chronologically
        combined_activity = []

        for e in expenses:
            combined_activity.append({
                'id': f"exp_{e.id}",
                'original_id': e.id,
                'title': e.title,
                'amount': float(e.amount),
                'category': e.category,
                'type': 'EXPENSE',
                'date': str(e.date),
                'created_at': e.created_at.isoformat()
            })

        for i in incomes:
            combined_activity.append({
                'id': f"inc_{i.id}",
                'original_id': i.id,
                'title': i.source,
                'amount': float(i.amount),
                'category': i.source,
                'type': 'INCOME',
                'date': str(i.date),
                'created_at': i.created_at.isoformat()
            })

        # Sort chronologically by date and creation time descending
        combined_activity.sort(key=lambda x: (x['date'], x['created_at']), reverse=True)

        return Response({
            'total_income': total_income,
            'total_expenses': total_expense,
            'remaining_amount': remaining_amount,
            'recent_activity': combined_activity[:10],
            'all_transactions': combined_activity
        })