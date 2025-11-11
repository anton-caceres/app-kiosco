from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, Sale, SaleItem, CashSession, CashMovement, Category

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id","username","first_name","last_name","is_staff"]

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id","name"]

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id","barcode","name","price","tax_rate","stock"]

class ProductFullSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id","barcode","name","category","cost","price","tax_rate","stock","min_stock"]

class SaleItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = ["product","qty","price","tax_rate","total"]

class SaleItemReadSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    class Meta:
        model = SaleItem
        fields = ["product","product_name","qty","price","tax_rate","total"]

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemWriteSerializer(many=True)
    class Meta:
        model = Sale
        fields = ["id","datetime","subtotal","tax_total","discount","total","payment_method","pos_id","items"]
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        user = self.context["request"].user
        sale = Sale.objects.create(user=user, **validated_data)
        for item in items_data:
            SaleItem.objects.create(sale=sale, **item)
            p = item["product"]
            p.stock = max(0, p.stock - item["qty"])
            p.save(update_fields=["stock","updated_at"])
        return sale

class SaleReadSerializer(serializers.ModelSerializer):
    items = SaleItemReadSerializer(many=True)
    user = UserSerializer()
    class Meta:
        model = Sale
        fields = ["id","datetime","user","subtotal","tax_total","discount","total","payment_method","pos_id","items"]

class CashSessionSerializer(serializers.ModelSerializer):
    is_open = serializers.SerializerMethodField()
    class Meta:
        model = CashSession
        fields = ["id","opened_at","closed_at","opening_amount","closing_amount","notes","is_open"]
    def get_is_open(self, obj): return obj.closed_at is None

class CashMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashMovement
        fields = ["id","type","amount","reason","created_at"]
        read_only_fields = ["created_at"]

from .models import Customer, CustomerAccountEntry

# ===== Clientes / Cuenta Corriente =====
from rest_framework import serializers  # por si no estuviera importado arriba

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id","name","document","phone","address","email","notes","active",
        ]
        read_only_fields = ["created_at"]

class CustomerAccountEntrySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    class Meta:
        model = CustomerAccountEntry
        fields = ["id","customer","customer_name","sale","type","amount","notes","created_at"]
        read_only_fields = ["created_at"]
