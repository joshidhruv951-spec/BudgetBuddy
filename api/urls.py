from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.ProfileViewSet)
router.register(r'incomes', views.IncomeViewSet)
router.register(r'expenses', views.ExpenseViewSet)
router.register(r'budgets', views.BudgetViewSet)
router.register(r'savings-goals', views.SavingsGoalViewSet)
router.register(r'notifications', views.NotificationViewSet)
router.register(r'reports', views.ReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]