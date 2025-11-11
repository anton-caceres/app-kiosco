from django.shortcuts import get_object_or_404
from django.db import models
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from .models import Customer, CustomerAccountEntry, Sale
from .serializers import CustomerSerializer, CustomerAccountEntrySerializer
from .permissions import IsEmployee

# ------- ABM Clientes -------
class CustomerList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        q = request.GET.get("q")
        qs = Customer.objects.filter(active=True)
        if q:
            qs = qs.filter(name__icontains=q)[:100]
        else:
            qs = qs.order_by("-created_at")[:100]
        return Response(CustomerSerializer(qs, many=True).data)

    def post(self, request):
        if not (request.user.is_staff or request.user.groups.filter(name="admin").exists()):
            return Response({"detail":"No autorizado"}, status=403)
        ser = CustomerSerializer(data=request.data)
        if ser.is_valid():
            c = ser.save()
            return Response(CustomerSerializer(c).data, status=201)
        return Response(ser.errors, status=400)

class CustomerDetail(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        c = get_object_or_404(Customer, pk=pk)
        return Response(CustomerSerializer(c).data)
    def put(self, request, pk):
        if not (request.user.is_staff or request.user.groups.filter(name="admin").exists()):
            return Response({"detail":"No autorizado"}, status=403)
        c = get_object_or_404(Customer, pk=pk)
        ser = CustomerSerializer(c, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)
    def delete(self, request, pk):
        if not (request.user.is_staff or request.user.groups.filter(name="admin").exists()):
            return Response({"detail":"No autorizado"}, status=403)
        c = get_object_or_404(Customer, pk=pk)
        c.active = False
        c.save(update_fields=["active"])
        return Response(status=204)

# ------- Cuenta Corriente -------
@api_view(["GET"])
@permission_classes([IsEmployee])
def customer_statement(request, customer_id):
    customer = get_object_or_404(Customer, pk=customer_id)
    entries = CustomerAccountEntry.objects.filter(customer=customer).order_by("-created_at","-id")
    deb = entries.filter(type="DEBIT").aggregate(models.Sum("amount"))["amount__sum"] or 0
    cred = entries.filter(type="CREDIT").aggregate(models.Sum("amount"))["amount__sum"] or 0
    balance = float(deb) - float(cred)
    return Response({
        "customer": CustomerSerializer(customer).data,
        "balance": balance,
        "entries": CustomerAccountEntrySerializer(entries, many=True).data
    })

@api_view(["POST"])
@permission_classes([IsEmployee])
def customer_register_payment(request, customer_id):
    customer = get_object_or_404(Customer, pk=customer_id)
    amount = float(request.data.get("amount", 0))
    notes = request.data.get("notes","Pago CC")
    if amount <= 0:
        return Response({"detail":"Monto inválido"}, status=400)
    e = CustomerAccountEntry.objects.create(customer=customer, type="CREDIT", amount=amount, notes=notes)
    return Response(CustomerAccountEntrySerializer(e).data, status=201)

@api_view(["GET"])
@permission_classes([IsEmployee])
def accounts_summary(request):
    data = []
    for c in Customer.objects.filter(active=True):
        deb = c.entries.filter(type="DEBIT").aggregate(models.Sum("amount"))["amount__sum"] or 0
        cred = c.entries.filter(type="CREDIT").aggregate(models.Sum("amount"))["amount__sum"] or 0
        bal = float(deb) - float(cred)
        if bal != 0:
            data.append({"customer_id": c.id, "customer": c.name, "balance": bal})
    data.sort(key=lambda x: -x["balance"])
    return Response({"rows": data})

@api_view(["GET"])
@permission_classes([IsEmployee])
def customer_credit(request, customer_id):
    c = get_object_or_404(Customer, pk=customer_id)
    deb = c.entries.filter(type="DEBIT").aggregate(models.Sum("amount"))["amount__sum"] or 0
    cred = c.entries.filter(type="CREDIT").aggregate(models.Sum("amount"))["amount__sum"] or 0
    balance = float(deb) - float(cred)
    return Response({
        "customer": CustomerSerializer(c).data,
        "balance": balance,
    })

