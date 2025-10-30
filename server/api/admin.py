from django.contrib import admin
from .models import CustomUser, Departement, Employe, Pointage, Conge, Evenement

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

# -------------------------------
# Conge Admin
# -------------------------------
@admin.register(Conge)
class CongeAdmin(admin.ModelAdmin):
    list_display = ('id_conge', 'employe', 'date_debut', 'date_fin', 'nbr_jours', 'motif', 'statut', 'date_demande', 'date_decision')
    search_fields = ('id_conge', 'employe__nom', 'employe__prenom')
    list_filter = ('statut',)

# -------------------------------
# Evenement Admin
# -------------------------------
@admin.register(Evenement)
class EvenementAdmin(admin.ModelAdmin):
    list_display = ('id_evenement', 'titre', 'description', 'date_debut', 'date_fin', 'duree', 'lieu')
    search_fields = ('id_evenement', 'titre')
    list_filter = ('date_debut', 'date_fin')
