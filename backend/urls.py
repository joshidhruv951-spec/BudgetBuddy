from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, ProfileViewSet, IncomeViewSet, ExpenseViewSet, TransactionViewSet,
    BudgetViewSet, SavingsGoalViewSet, NotificationViewSet, ReportViewSet
)

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'incomes', IncomeViewSet, basename='income')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'savings-goals', SavingsGoalViewSet, basename='savingsgoal')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]