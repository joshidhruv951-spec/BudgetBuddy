from rest_framework import generics, viewsets, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from .models import Profile, Income, Expense, Transaction, Budget, SavingsGoal, Notification, Report
from .serializers import (
    RegisterSerializer, ProfileSerializer, IncomeSerializer, ExpenseSerializer,
    TransactionSerializer, BudgetSerializer, SavingsGoalSerializer,
    NotificationSerializer, ReportSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class BaseUserViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExpenseViewSet(BaseUserViewSet):
    serializer_class = ExpenseSerializer
    queryset = Expense.objects.all()


class TransactionViewSet(BaseUserViewSet):
    serializer_class = TransactionSerializer
    queryset = Transaction.objects.all()


class ProfileViewSet(BaseUserViewSet):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()


class IncomeViewSet(BaseUserViewSet):
    serializer_class = IncomeSerializer
    queryset = Income.objects.all()


class BudgetViewSet(BaseUserViewSet):
    serializer_class = BudgetSerializer
    queryset = Budget.objects.all()


class SavingsGoalViewSet(BaseUserViewSet):
    serializer_class = SavingsGoalSerializer
    queryset = SavingsGoal.objects.all()


class NotificationViewSet(BaseUserViewSet):
    serializer_class = NotificationSerializer
    queryset = Notification.objects.all()


class ReportViewSet(BaseUserViewSet):
    serializer_class = ReportSerializer
    queryset = Report.objects.all()