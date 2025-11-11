from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Product, Sale, CashSession, CashMovement, Category
from .serializers import (
    ProductSerializer, ProductFullSerializer, CategorySerializer,
    SaleSerializer, SaleReadSerializer, CashSessionSerializer, CashMovementSerializer
)
from .permissions import IsAdmin, IsEmployee
from .utils import current_session

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    groups = list(u.groups.values_list("name", flat=True))
    return Response({"id":u.id,"username":u.username,"is_staff":u.is_staff,"groups":groups})

# ---------- Productos ----------
from rest_framework.views import APIView

class ProductList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        q = request.GET.get("query")
        bc = request.GET.get("barcode")
        qs = Product.objects.all()
        if bc:
            prod = get_object_or_404(qs, barcode=bc)
            return Response(ProductSerializer(prod).data)
        if q:
            qs = qs.filter(name__icontains=q)[:50]
        else:
            qs = qs.order_by("-updated_at")[:50]
        return Response(ProductSerializer(qs, many=True).data)
    def post(self, request):
        if not (request.user.is_staff or request.user.groups.filter(name="admin").exists()):
            return Response({"detail":"No autorizado"}, status=403)
        ser = ProductFullSerializer(data=request.data)
        if ser.is_valid():
            p = ser.save()
            return Response(ProductFullSerializer(p).data, status=201)
        return Response(ser.errors, status=400)

class ProductDetail(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        p = get_object_or_404(Product, pk=pk)
        return Response(ProductFullSerializer(p).data)
    def put(self, request, pk):
        if not (request.user.is_staff or request.user.groups.filter(name="admin").exists()):
            return Response({"detail":"No autorizado"}, status=403)
        p = get_object_or_404(Product, pk=pk)
        ser = ProductFullSerializer(p, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)
    def delete(self, request, pk):
        if not (request.user.is_staff or request.user.groups.filter(name="admin").exists()):
            return Response({"detail":"No autorizado"}, status=403)
        p = get_object_or_404(Product, pk=pk)
        p.delete()
        return Response(status=204)

class CategoryList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(CategorySerializer(Category.objects.all(), many=True).data)
    def post(self, request):
        if not (request.user.is_staff or request.user.groups.filter(name="admin").exists()):
            return Response({"detail":"No autorizado"}, status=403)
        ser = CategorySerializer(data=request.data)
        if ser.is_valid():
            c = ser.save()
            return Response(CategorySerializer(c).data, status=201)
        return Response(ser.errors, status=400)

# ---------- Ventas (requiere caja abierta + stock) ----------
@api_view(["POST"])
@permission_classes([IsEmployee])
@transaction.atomic
def create_sale(request):
    session = current_session()
    if not session:
        return Response({"detail":"Debe abrir caja antes de vender."}, status=400)

    # Validación de stock
    items = request.data.get("items", [])
    qty_map = {}
    for it in items:
        pid = it.get("product")
        qty = int(it.get("qty", 0))
        if pid is None or qty <= 0:
            return Response({"detail":"Item inválido."}, status=400)
        qty_map[pid] = qty_map.get(pid, 0) + qty

    prods = {p.id: p for p in Product.objects.filter(id__in=qty_map.keys())}
    insuf = []
    for pid, need in qty_map.items():
        p = prods.get(pid)
        if not p:
            insuf.append({"product": pid, "name":"(desconocido)", "available": 0, "need": need})
        elif p.stock < need:
            insuf.append({"product": pid, "name": p.name, "available": p.stock, "need": need})
    if insuf:
        return Response({"detail":"Stock insuficiente", "items": insuf}, status=400)

    serializer = SaleSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        sale = serializer.save()
        return Response(SaleReadSerializer(sale).data, status=201)
    return Response(serializer.errors, status=400)

# ---------- Caja ----------
@api_view(["GET"])
@permission_classes([IsEmployee])
def cash_status(request):
    s = current_session()
    if not s: return Response({"open": False})
    moves = CashMovement.objects.filter(session=s)
    moved = sum([ float(m.amount) if m.type=="IN" else -float(m.amount) for m in moves ])
    total_sales = sum([ float(x) for x in Sale.objects.filter(datetime__gte=s.opened_at, datetime__lte=timezone.now()).values_list("total", flat=True) ])
    current = float(s.opening_amount) + moved + total_sales
    return Response({"open": True, "session": CashSessionSerializer(s).data, "current_amount": current})

@api_view(["POST"])
@permission_classes([IsEmployee])
def cash_open(request):
    if current_session(): return Response({"detail":"Ya hay una caja abierta."}, status=400)
    opening_amount = float(request.data.get("opening_amount", 0))
    s = CashSession.objects.create(opening_amount=opening_amount, opened_by=request.user, notes=request.data.get("notes",""))
    return Response(CashSessionSerializer(s).data, status=201)

@api_view(["POST"])
@permission_classes([IsEmployee])
def cash_move(request):
    s = current_session()
    if not s: return Response({"detail":"No hay caja abierta."}, status=400)
    serializer = CashMovementSerializer(data=request.data)
    if serializer.is_valid():
        CashMovement.objects.create(session=s, **serializer.validated_data)
        return Response({"ok":True}, status=201)
    return Response(serializer.errors, status=400)

@api_view(["POST"])
@permission_classes([IsEmployee])
def cash_close(request):
    s = current_session()
    if not s: return Response({"detail":"No hay caja abierta."}, status=400)
    s.closing_amount = float(request.data.get("closing_amount", 0))
    s.closed_at = timezone.now()
    s.closed_by = request.user
    s.notes = request.data.get("notes","")
    s.save(update_fields=["closing_amount","closed_at","closed_by","notes"])
    return Response(CashSessionSerializer(s).data)

# ---------- Resumen y CSV de Caja ----------
from django.http import HttpResponse
import csv

def _cash_summary(session: CashSession):
    sales_qs = Sale.objects.filter(datetime__gte=session.opened_at, datetime__lte=session.closed_at or timezone.now())
    by_method = {}
    for s in sales_qs.values("payment_method").annotate(total=models.Sum("total")):
        by_method[s["payment_method"]] = float(s["total"] or 0)
    moves = CashMovement.objects.filter(session=session)
    ing = sum(float(m.amount) for m in moves.filter(type="IN"))
    egr = sum(float(m.amount) for m in moves.filter(type="OUT"))
    opening = float(session.opening_amount)
    efectivo_ventas = by_method.get("efectivo", 0.0)
    efectivo_esperado = opening + ing - egr + efectivo_ventas
    return {
        "session_id": session.id,
        "opened_at": session.opened_at,
        "closed_at": session.closed_at,
        "opening_amount": opening,
        "ingresos": ing,
        "egresos": egr,
        "ventas_por_medio": by_method,
        "efectivo_esperado": efectivo_esperado,
        "closing_amount": float(session.closing_amount or 0),
        "diferencia": float((session.closing_amount or 0) - efectivo_esperado),
    }

@api_view(["GET"])
@permission_classes([IsEmployee])
def cash_summary(request):
    sid = request.GET.get("session_id")
    if sid:
        s = get_object_or_404(CashSession, pk=sid)
    else:
        s = current_session() or CashSession.objects.order_by("-opened_at").first()
    if not s:
        return Response({"detail":"No hay sesiones de caja."}, status=404)
    return Response(_cash_summary(s))

@api_view(["GET"])
@permission_classes([IsEmployee])
def cash_summary_csv(request):
    sid = request.GET.get("session_id")
    if sid:
        s = get_object_or_404(CashSession, pk=sid)
    else:
        s = current_session() or CashSession.objects.order_by("-opened_at").first()
    if not s:
        return Response({"detail":"No hay sesiones de caja."}, status=404)
    data = _cash_summary(s)
    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    name = f"caja_{s.id}_{(s.closed_at or timezone.now()).date()}.csv"
    resp["Content-Disposition"] = f'attachment; filename="{name}"'
    w = csv.writer(resp)
    w.writerow(["Campo","Valor"])
    w.writerow(["Sesion", data["session_id"]])
    w.writerow(["Abierta", data["opened_at"]])
    w.writerow(["Cerrada", data["closed_at"]])
    w.writerow(["Apertura", data["opening_amount"]])
    w.writerow(["Ingresos", data["ingresos"]])
    w.writerow(["Egresos", data["egresos"]])
    w.writerow(["Ventas efectivo", data["ventas_por_medio"].get("efectivo",0.0)])
    w.writerow(["Ventas QR", data["ventas_por_medio"].get("qr",0.0)])
    w.writerow(["Ventas tarjeta", data["ventas_por_medio"].get("tarjeta",0.0)])
    w.writerow(["Efectivo esperado", data["efectivo_esperado"]])
    w.writerow(["Cierre contado", data["closing_amount"]])
    w.writerow(["Diferencia", data["diferencia"]])
    return resp

# ---------- Reporte Diario (simple) ----------
@api_view(["GET"])
@permission_classes([IsEmployee])
def report_daily(request):
    date_str = request.GET.get("date")
    if date_str:
        day = datetime.strptime(date_str, "%Y-%m-%d").date()
    else:
        day = timezone.localdate()
    start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
    end = timezone.make_aware(datetime.combine(day, datetime.max.time()))
    qs = Sale.objects.filter(datetime__gte=start, datetime__lte=end).order_by("datetime")
    total = sum([float(s.total) for s in qs])
    count = qs.count()
    return Response({"date": str(day), "count": count, "total": total})

# ===== Informes agregados =====
@api_view(["GET"])
@permission_classes([IsEmployee])
def sales_detailed(request):
    """
    /api/reports/sales_detailed?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    Devuelve ventas con items (detalle por fecha).
    """
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")
    if not date_from or not date_to:
        day = timezone.localdate()
        start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
        end = timezone.make_aware(datetime.combine(day, datetime.max.time()))
    else:
        start = timezone.make_aware(datetime.combine(datetime.strptime(date_from,"%Y-%m-%d").date(), datetime.min.time()))
        end = timezone.make_aware(datetime.combine(datetime.strptime(date_to,"%Y-%m-%d").date(), datetime.max.time()))

    qs = Sale.objects.filter(datetime__gte=start, datetime__lte=end).order_by("datetime").prefetch_related("items","user","items__product")
    data = []
    for s in qs:
        items = [{
            "product_id": it.product_id,
            "product_name": it.product.name,
            "qty": it.qty,
            "price": float(it.price),
            "tax_rate": float(it.tax_rate),
            "total": float(it.total),
        } for it in s.items.all()]
        data.append({
            "id": s.id,
            "datetime": s.datetime,
            "user": s.user.username,
            "payment_method": s.payment_method,
            "subtotal": float(s.subtotal),
            "tax_total": float(s.tax_total),
            "total": float(s.total),
            "items": items,
        })
    return Response({"from": start.isoformat(), "to": end.isoformat(), "count": len(data), "sales": data})

@api_view(["GET"])
@permission_classes([IsEmployee])
def sales_by_category(request):
    """
    /api/reports/by_category?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    """
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")
    if not date_from or not date_to:
        day = timezone.localdate()
        start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
        end = timezone.make_aware(datetime.combine(day, datetime.max.time()))
    else:
        start = timezone.make_aware(datetime.combine(datetime.strptime(date_from,"%Y-%m-%d").date(), datetime.min.time()))
        end = timezone.make_aware(datetime.combine(datetime.strptime(date_to,"%Y-%m-%d").date(), datetime.max.time()))
    from .models import SaleItem, Product, Category
    # join items -> product -> category
    rows = (SaleItem.objects
            .filter(sale__datetime__gte=start, sale__datetime__lte=end)
            .values("product__category__id","product__category__name")
            .annotate(qty=models.Sum("qty"), total=models.Sum("total"))
            .order_by("product__category__name"))
    data = [{"category_id": r["product__category__id"], "category": r["product__category__name"] or "(Sin categoría)",
             "qty": int(r["qty"] or 0), "total": float(r["total"] or 0)} for r in rows]
    return Response({"from": start.isoformat(), "to": end.isoformat(), "rows": data})

@api_view(["GET"])
@permission_classes([IsEmployee])
def sales_by_product(request):
    """
    /api/reports/by_product?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    """
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")
    if not date_from or not date_to:
        day = timezone.localdate()
        start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
        end = timezone.make_aware(datetime.combine(day, datetime.max.time()))
    else:
        start = timezone.make_aware(datetime.combine(datetime.strptime(date_from,"%Y-%m-%d").date(), datetime.min.time()))
        end = timezone.make_aware(datetime.combine(datetime.strptime(date_to,"%Y-%m-%d").date(), datetime.max.time()))
    from .models import SaleItem
    rows = (SaleItem.objects
            .filter(sale__datetime__gte=start, sale__datetime__lte=end)
            .values("product_id","product__name","product__barcode")
            .annotate(qty=models.Sum("qty"), total=models.Sum("total"))
            .order_by("-total","product__name")[:500])
    data = [{"product_id": r["product_id"], "barcode": r["product__barcode"], "product": r["product__name"],
             "qty": int(r["qty"] or 0), "total": float(r["total"] or 0)} for r in rows]
    return Response({"from": start.isoformat(), "to": end.isoformat(), "rows": data})

@api_view(["GET"])
@permission_classes([IsEmployee])
def sales_by_method(request):
    """
    /api/reports/by_method?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    """
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")
    if not date_from or not date_to:
        day = timezone.localdate()
        start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
        end = timezone.make_aware(datetime.combine(day, datetime.max.time()))
    else:
        start = timezone.make_aware(datetime.combine(datetime.strptime(date_from,"%Y-%m-%d").date(), datetime.min.time()))
        end = timezone.make_aware(datetime.combine(datetime.strptime(date_to,"%Y-%m-%d").date(), datetime.max.time()))
    rows = (Sale.objects
            .filter(datetime__gte=start, datetime__lte=end)
            .values("payment_method")
            .annotate(total=models.Sum("total"), count=models.Count("id"))
            .order_by("payment_method"))
    data = [{"method": r["payment_method"], "total": float(r["total"] or 0), "count": int(r["count"] or 0)} for r in rows]
    return Response({"from": start.isoformat(), "to": end.isoformat(), "rows": data})
