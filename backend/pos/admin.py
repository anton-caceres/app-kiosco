from django.contrib import admin
from django.db.models import Sum
from .models import (
    # POS
    Product, Category, Sale, SaleItem, CashSession, CashMovement,
    # puede llamarse StockMove o StockMovement según tu modelo
)

# Registrar StockMove de forma segura si existe con cualquiera de estos nombres
try:
    from .models import StockMove as _StockModel
except Exception:
    try:
        from .models import StockMovement as _StockModel
    except Exception:
        _StockModel = None

# ========= Clientes / Cuenta Corriente =========
from .models import Customer, CustomerAccountEntry

class CustomerAccountEntryInline(admin.TabularInline):
    model = CustomerAccountEntry
    extra = 0
    can_delete = False
    readonly_fields = ("type","amount","sale","notes","created_at")
    fields = ("created_at","type","amount","sale","notes")
    ordering = ("-created_at", "-id")

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    search_fields = ("name","document","phone","email","address")
    readonly_fields = ("created_at",)
    inlines = [CustomerAccountEntryInline]

    @admin.display(description="Balance")
    def balance(self, obj):
        deb = obj.entries.filter(type="DEBIT").aggregate(Sum("amount"))["amount__sum"] or 0
        cred = obj.entries.filter(type="CREDIT").aggregate(Sum("amount"))["amount__sum"] or 0
        return float(deb) - float(cred)

@admin.register(CustomerAccountEntry)
class CustomerAccountEntryAdmin(admin.ModelAdmin):
    list_display = ("created_at","customer","type","amount","sale","notes")
    list_filter = ("type",)
    search_fields = ("customer__name","notes")
    readonly_fields = ("created_at",)
    ordering = ("-created_at","-id")

# ========= POS básicos =========
# (Admins sencillos para garantizar que existan las rutas en /admin/)
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id","name","price","stock","category")
    search_fields = ("name","barcode")
    list_filter = ("category",)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id","name")

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("id","datetime","user","payment_method","total")
    date_hierarchy = "datetime"
    search_fields = ("id",)

@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ("id","sale","product","qty","price","total")

@admin.register(CashSession)
class CashSessionAdmin(admin.ModelAdmin):
    list_display = ("id","opened_at","closed_at","opening_amount","closing_amount","is_open")
    def is_open(self, obj): return not bool(obj.closed_at)

@admin.register(CashMovement)
class CashMovementAdmin(admin.ModelAdmin):
    list_display = ("id","created_at","type","amount","reason")

if _StockModel:
    @admin.register(_StockModel)
    class StockModelAdmin(admin.ModelAdmin):
        list_display = ("id",)  # campos mínimos para no romper si difieren
