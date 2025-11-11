from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from pos.models import Product, Category

class Command(BaseCommand):
    help = "Carga datos demo: grupos, usuarios y productos"

    def handle(self, *args, **kwargs):
        # Grupos
        admin_g, _ = Group.objects.get_or_create(name="admin")
        emp_g, _ = Group.objects.get_or_create(name="employee")

        # Usuarios
        if not User.objects.filter(username="admin").exists():
            u = User.objects.create_user("admin", password="admin123", is_staff=True, is_superuser=True)
            u.groups.add(admin_g)
        if not User.objects.filter(username="empleado").exists():
            u = User.objects.create_user("empleado", password="empleado123", is_staff=False, is_superuser=False)
            u.groups.add(emp_g)

        # Productos demo
        bebidas,_ = Category.objects.get_or_create(name="Bebidas")
        snacks,_ = Category.objects.get_or_create(name="Snacks")
        data = [
            ("7791234567890","Coca-Cola 500ml",bebidas,500,750,21,50),
            ("7790987654321","Agua 500ml",bebidas,300,500,21,80),
            ("7791111111111","Alfajor Triple",snacks,250,400,21,120),
        ]
        for b,n,c,co,p,iva,s in data:
            Product.objects.update_or_create(
                barcode=b,
                defaults=dict(name=n,category=c,cost=co,price=p,tax_rate=iva,stock=s)
            )
        self.stdout.write(self.style.SUCCESS("Seed listo: usuarios admin/empleado y productos."))
