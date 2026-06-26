from rest_framework import serializers


class DashboardSummarySerializer(serializers.Serializer):
    totalDue = serializers.DecimalField(max_digits=14, decimal_places=2)
    currentMonthSales = serializers.DecimalField(max_digits=14, decimal_places=2)
    currentMonthPayments = serializers.DecimalField(max_digits=14, decimal_places=2)
    currentMonthNetDueChange = serializers.DecimalField(max_digits=14, decimal_places=2)
    totalCustomers = serializers.IntegerField()
    totalTransactions = serializers.IntegerField()


class RecentTransactionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    displayId = serializers.CharField()
    customerId = serializers.IntegerField()
    customerNameBn = serializers.CharField()
    customerNameEn = serializers.CharField()
    transactionType = serializers.CharField()
    date = serializers.DateField()
    totalAmount = serializers.DecimalField(max_digits=12, decimal_places=2)
    updatedAt = serializers.DateTimeField()


class RecentCustomerSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    fullNameBn = serializers.CharField()
    fullNameEn = serializers.CharField()
    phone = serializers.CharField()
    addressBn = serializers.CharField()
    addressEn = serializers.CharField()
    currentBalance = serializers.DecimalField(max_digits=14, decimal_places=2)
    updatedAt = serializers.DateTimeField()


class MonthlySalesPaymentsSerializer(serializers.Serializer):
    month = serializers.IntegerField()
    monthName = serializers.CharField()
    sales = serializers.DecimalField(max_digits=14, decimal_places=2)
    payments = serializers.DecimalField(max_digits=14, decimal_places=2)


class MonthlyDueChangeSerializer(serializers.Serializer):
    month = serializers.IntegerField()
    monthName = serializers.CharField()
    netDueChange = serializers.DecimalField(max_digits=14, decimal_places=2)


class MonthlyTransactionCountsSerializer(serializers.Serializer):
    month = serializers.IntegerField()
    monthName = serializers.CharField()
    salesCount = serializers.IntegerField()
    paymentsCount = serializers.IntegerField()
    initialCount = serializers.IntegerField()


class TopCustomerByDueSerializer(serializers.Serializer):
    customerId = serializers.IntegerField()
    customerNameBn = serializers.CharField()
    customerNameEn = serializers.CharField()
    currentBalance = serializers.DecimalField(max_digits=14, decimal_places=2)


class YearlyStatsSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    monthlySalesPayments = MonthlySalesPaymentsSerializer(many=True)
    monthlyDueChange = MonthlyDueChangeSerializer(many=True)
    monthlyTransactionCounts = MonthlyTransactionCountsSerializer(many=True)
    topCustomersByDue = TopCustomerByDueSerializer(many=True)
    yearlySalesTotal = serializers.DecimalField(max_digits=14, decimal_places=2)
    yearlyPaymentsTotal = serializers.DecimalField(max_digits=14, decimal_places=2)
    availableYears = serializers.ListField(child=serializers.IntegerField())


class DashboardSerializer(serializers.Serializer):
    summary = DashboardSummarySerializer()
    recentTransactions = RecentTransactionSerializer(many=True)
    recentCustomers = RecentCustomerSerializer(many=True)
    yearlyStats = YearlyStatsSerializer()
