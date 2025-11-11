from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=80)
    def __str__(self): return self.name

class Product(models.Model):
    barcode = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=4, decimal_places=2, default=21)
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f"{self.name} ({self.barcode})"

class CashSession(models.Model):
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    opened_by = models.ForeignKey(User, related_name="cash_opened", on_delete=models.PROTECT)
    closed_by = models.ForeignKey(User, related_name="cash_closed", null=True, blank=True, on_delete=models.SET_NULL)
    opening_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    closing_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default="")
    def is_open(self): return self.closed_at is None
    def __str__(self): return f"Caja #{self.id} - {'Abierta' if self.is_open() else 'Cerrada'}"

class CashMovement(models.Model):
    IN='IN'; OUT='OUT'
    TYPES=[(IN,'Ingreso'),(OUT,'Egreso')]
    session = models.ForeignKey(CashSession, related_name="moves", on_delete=models.CASCADE)
    type = models.CharField(max_length=3, choices=TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=120, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

class Sale(models.Model):
    datetime = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, default="efectivo")
    pos_id = models.CharField(max_length=20, default="PV-0001")

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=4, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

class StockMove(models.Model):
    IN='IN'; OUT='OUT'; ADJ='ADJ'
    TYPES=[(IN,'Ingreso'),(OUT,'Salida'),(ADJ,'Ajuste')]
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    type = models.CharField(max_length=3, choices=TYPES)
    qty = models.IntegerField()
    reason = models.CharField(max_length=120, blank=True, default="")
    ref_id = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

# ================= CLIENTES / CUENTA CORRIENTE =================
from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=200)
    document = models.CharField(max_length=64, blank=True, null=True)
    phone = models.CharField(max_length=64, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    active = models.BooleanField(default=True)
    # Crédito
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allow_over_limit = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class CustomerAccountEntry(models.Model):
    TYPE_CHOICES = (("DEBIT","DEBIT"),("CREDIT","CREDIT"))
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name="entries")
    sale = models.ForeignKey('Sale', on_delete=models.SET_NULL, blank=True, null=True, related_name="account_entries")
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at","-id"]
