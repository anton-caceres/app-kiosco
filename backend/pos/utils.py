from .models import CashSession

def current_session():
    return CashSession.objects.filter(closed_at__isnull=True).order_by("-opened_at").first()
