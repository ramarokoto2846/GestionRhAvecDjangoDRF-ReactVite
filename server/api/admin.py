from django.contrib import admin
from .models import CustomUser, Departement, Employe, Pointage

# -------------------------------
# CustomUser Admin
# -------------------------------
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'nom', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'nom')

# -------------------------------
# Departement Admin
# -------------------------------
@admin.register(Departement)
class DepartementAdmin(admin.ModelAdmin):
    list_display = ('id_departement', 'nom', 'responsable', 'nbr_employe', 'localisation')
    search_fields = ('id_departement', 'nom')

# -------------------------------
# Employe Admin
# -------------------------------
@admin.register(Employe)
class EmployeAdmin(admin.ModelAdmin):
    list_display = ('matricule', 'titre', 'nom', 'prenom', 'email', 'telephone', 'poste', 'departement', 'statut')
    search_fields = ('matricule', 'nom', 'prenom', 'email')
    list_filter = ('statut', 'titre', 'departement')

# -------------------------------
# Pointage Admin
# -------------------------------
@admin.register(Pointage)
class PointageAdmin(admin.ModelAdmin):
    list_display = ('id_pointage', 'employe', 'date_pointage', 'heure_entree', 'heure_sortie', 'duree_travail', 'remarque')
    search_fields = ('id_pointage', 'employe__nom', 'employe__prenom', 'employe__matricule')
    list_filter = ('date_pointage',)
