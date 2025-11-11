from django.urls import path

# Vistas existentes (productos/ventas/caja/reportes simples)
from .views import (
    me,
    ProductList, ProductDetail, CategoryList,
    create_sale,
    cash_status, cash_open, cash_move, cash_close,
    cash_summary, cash_summary_csv,
    report_daily,
    sales_detailed, sales_by_category, sales_by_product, sales_by_method,
)

# Vistas nuevas separadas (clientes/cuentas)
from .views_customers import (
    CustomerList, CustomerDetail, customer_statement, customer_register_payment,
    accounts_summary, customer_credit,
)

urlpatterns = [
    # Auth/info
    path("me", me),

    # Productos / categorías
    path("products", ProductList.as_view()),
    path("products/<int:pk>", ProductDetail.as_view()),
    path("categories", CategoryList.as_view()),

    # Ventas
    path("sales", create_sale),

    # Caja
    path("cash/status", cash_status),
    path("cash/open", cash_open),
    path("cash/move", cash_move),
    path("cash/close", cash_close),
    path("cash/summary", cash_summary),
    path("cash/summary.csv", cash_summary_csv),

    # Reportes
    path("reports/daily", report_daily),
    path("reports/sales_detailed", sales_detailed),
    path("reports/by_category", sales_by_category),
    path("reports/by_product", sales_by_product),
    path("reports/by_method", sales_by_method),

    # Clientes
    path("customers", CustomerList.as_view()),
    path("customers/<int:pk>", CustomerDetail.as_view()),
    path("customers/<int:customer_id>/credit", customer_credit),

    # Cuentas corrientes
    path("accounts/<int:customer_id>/statement", customer_statement),
    path("accounts/<int:customer_id>/pay", customer_register_payment),
    path("accounts/summary", accounts_summary),
]
