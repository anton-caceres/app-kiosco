from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or request.user.groups.filter(name="admin").exists())

class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user and (request.user.groups.filter(name__in=["employee","admin"]).exists() or request.user.is_staff)
