# permissions.py
from rest_framework import permissions

class IsOwnerOrAdminForWrite(permissions.BasePermission):
    """
    Permission personnalisée :
    - Tous les utilisateurs authentifiés peuvent créer (POST) leurs propres données
    - Tous les utilisateurs authentifiés peuvent voir les données (GET, HEAD, OPTIONS)
    - Seuls le créateur de l'objet, un superutilisateur, ou le responsable du département peuvent modifier/supprimer (PUT, PATCH, DELETE)
    """
    def has_permission(self, request, view):
        # Tous les utilisateurs authentifiés ont accès en lecture ET création
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Autoriser les méthodes de lecture pour tous les authentifiés
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Autoriser POST pour tous les authentifiés (création de ses propres données)
        if request.method == 'POST':
            # Vérifier que l'utilisateur crée ses propres données
            # Cette vérification se fait généralement dans la vue via serializer.save(created_by=request.user)
            return True

        # Autoriser les superutilisateurs pour toutes les actions
        if request.user.is_superuser:
            return True

        # Autoriser la modification/suppression pour le créateur
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True

        # Autoriser si l'utilisateur est l'employé concerné (pour Pointage)
        if hasattr(obj, 'employe') and hasattr(obj.employe, 'user'):
            if obj.employe.user == request.user:
                return True

        # Autoriser les responsables du département pour les pointages
        if hasattr(obj, 'employe') and hasattr(obj.employe, 'departement'):
            if obj.employe.departement and obj.employe.departement.responsable == request.user.email:
                return True
        
        return False


class IsAuthenticatedCRUD(permissions.BasePermission):
    """
    Permission simple: tout utilisateur authentifié peut faire toutes les opérations CRUD
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Autoriser toutes les actions pour les utilisateurs authentifiés
        return request.user and request.user.is_authenticated


class IsOwnerOrReadOnlyForSelf(permissions.BasePermission):
    """
    Permission personnalisée pour permettre à tout utilisateur authentifié:
    - Lecture seule sur toutes les données
    - Écriture seulement sur SES PROPRES données
    """
    
    def has_permission(self, request, view):
        # Autoriser tous les utilisateurs authentifiés
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Vérifier si l'utilisateur est le propriétaire de l'objet
        # Pour les employés: vérifier si l'utilisateur est l'employé
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        # Pour les pointages: vérifier si l'utilisateur a créé le pointage
        # ou si le pointage appartient à son employé
        if hasattr(obj, 'employe') and hasattr(obj.employe, 'created_by'):
            return obj.employe.created_by == request.user
        
        return False