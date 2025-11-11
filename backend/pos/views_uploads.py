from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
import os

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_logo(request):
    """
    Recibe multipart/form-data con campo 'file'.
    Guarda en MEDIA_ROOT/logos/ y devuelve {"url": "<media-url>"}.
    """
    f = request.FILES.get("file")
    if not f:
        return Response({"detail":"Falta archivo (file)"}, status=400)

    # carpeta logos
    dest_dir = os.path.join(settings.MEDIA_ROOT, "logos")
    os.makedirs(dest_dir, exist_ok=True)

    # nombre seguro con timestamp
    ts = timezone.now().strftime("%Y%m%d%H%M%S")
    name, ext = os.path.splitext(f.name or "logo")
    fname = f"{name}_{ts}{ext or '.png'}"
    dest_path = os.path.join(dest_dir, fname)

    # guardar a disco en chunks
    with open(dest_path, "wb+") as out:
        for chunk in f.chunks():
            out.write(chunk)

    rel_path = f"logos/{fname}"
    # URL absoluta para el frontend
    url = request.build_absolute_uri(os.path.join(settings.MEDIA_URL, rel_path))
    return Response({"url": url}, status=201)
