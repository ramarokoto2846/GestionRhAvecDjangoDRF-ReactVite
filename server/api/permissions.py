# permissions.py
from rest_framework import permissions

class IsOwnerOrAdminForWrite(permissions.BasePermission):
    """
    Permission personnalisée :
    - Tous les utilisateurs authentifiés peuvent voir les données (GET, HEAD, OPTIONS).
    - Seuls le créateur de l'objet, un superutilisateur, ou le responsable du département peuvent modifier/supprimer (PUT, PATCH, DELETE).
    - Pour les congés, les responsables du département de l'employé peuvent valider/refuser.
    """
    def has_permission(self, request, view):
        # Tous les utilisateurs authentifiés ont accès en lecture
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Autoriser les méthodes de lecture pour tous
        if request.method in permissions.SAFE_METHODS:
            return True

        # Autoriser les superutilisateurs pour toutes les actions
        if request.user.is_superuser:
            return True

        # Autoriser la modification/suppression pour le créateur
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True

        # Autoriser si l'utilisateur est l'employé concerné (pour Pointage, Absence, Conge)
        if hasattr(obj, 'employe') and obj.employe.user == request.user:
            return True

        # Autoriser les responsables du département pour les congés, absences, et pointages
        if hasattr(obj, 'employe') and obj.employe.departement.responsable == request.user.email:
            return True