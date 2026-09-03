from rest_framework import serializers
from .models import Expense, Income, Budget, CategoryBudget, EXPENSE_CATEGORIES, INCOME_SOURCES

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'title', 'amount', 'category', 'date', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_category(self, value):
        valid_cats = [c[0] for c in EXPENSE_CATEGORIES]
        if value not in valid_cats:
            raise serializers.ValidationError(
                f"Invalid category '{value}'. Must be one of: {', '.join(valid_cats)}"
            )
        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Expense amount must be greater than 0.")
        return value


class IncomeSerializer(serializers.ModelSerializer):
    source = serializers.CharField(required=False)
    income_type = serializers.CharField(required=False)

    class Meta:
        model = Income
        fields = ['id', 'source', 'income_type', 'amount', 'date', 'details', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        source_val = data.get('income_type') or data.get('source')
        if not source_val:
            raise serializers.ValidationError({"income_type": ["This field is required."]})
        
        valid_sources = [s[0] for s in INCOME_SOURCES]
        if source_val not in valid_sources:
            raise serializers.ValidationError(
                {"income_type": [f"Must be one of: {', '.join(valid_sources)}"]}
            )
        
        data['source'] = source_val
        return data

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Income amount must be greater than 0.")
        return value


class CategoryBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryBudget
        fields = ['id', 'category', 'allocated_amount']

    def validate_category(self, value):
        valid_cats = [c[0] for c in EXPENSE_CATEGORIES]
        if value not in valid_cats:
            raise serializers.ValidationError(f"Invalid category '{value}'.")
        return value

    def validate_allocated_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Allocated amount must be greater than 0.")
        return value


class BudgetSerializer(serializers.ModelSerializer):
    category_allocations = CategoryBudgetSerializer(many=True, required=False)

    class Meta:
        model = Budget
        fields = ['id', 'month', 'year', 'total_amount', 'category_allocations', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_month(self, value):
        if not (1 <= int(value) <= 12):
            raise serializers.ValidationError("Month must be between 1 and 12.")
        return value

    def validate_total_amount(self, value):
        if float(value) <= 0:
            raise serializers.ValidationError("Total budget must be greater than 0.")
        return value

    def create(self, validated_data):
        allocations_data = validated_data.pop('category_allocations', [])
        user = self.context['request'].user
        
        budget, _ = Budget.objects.update_or_create(
            user=user,
            month=validated_data['month'],
            year=validated_data['year'],
            defaults={'total_amount': validated_data['total_amount']}
        )
        
        budget.category_allocations.all().delete()
        for alloc in allocations_data:
            CategoryBudget.objects.create(
                budget=budget,
                category=alloc['category'],
                allocated_amount=alloc['allocated_amount']
            )

        return budget