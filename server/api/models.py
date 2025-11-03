# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from datetime import datetime, time, date

# ========================
# Custom User
# ========================
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required field')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(max_length=200, unique=True)
    nom = models.CharField(max_length=100, null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

# ========================
# Departement
# ========================
class Departement(models.Model):
    id_departement = models.CharField(max_length=10, primary_key=True)
    nom = models.CharField(max_length=100)
    responsable = models.TextField()
    description = models.TextField(blank=True, null=True)
    nbr_employe = models.IntegerField(default=0)
    localisation = models.TextField()
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_departements')

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        if self.pk:
            self.nbr_employe = self.employes.count()
        super().save(*args, **kwargs)

# ========================
# Employe
# ========================
class Employe(models.Model):
    STATUT_VALIDE = [
        ('actif', 'Actif'),
        ('inactif', 'Inactif')
    ]

    TITRE_VALIDE = [
        ('stagiaire', 'Stagiaire'),
        ('employe', 'Employe Fixe')
    ]

    matricule = models.CharField(
        max_length=6,
        primary_key=True,
        validators=[RegexValidator(r'^\d{6}$', 'Le matricule doit contenir exactement 6 chiffres')]
    )
    titre = models.CharField(
        max_length=20,
        choices=TITRE_VALIDE,
        default='stagiaire'
    )
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=50, blank=True, null=True)
    poste = models.CharField(max_length=100)
    departement = models.ForeignKey(Departement, on_delete=models.CASCADE, related_name="employes")
    statut = models.CharField(max_length=20, choices=STATUT_VALIDE, default='actif')
    user = models.OneToOneField(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='employe_profile')
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_employes')

    def __str__(self):
        return f"{self.nom} {self.prenom} ({self.matricule})"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        old_departement = None

        if not is_new:
            try:
                old_instance = Employe.objects.get(pk=self.matricule)
                old_departement = old_instance.departement
            except Employe.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if self.departement_id:
            self.departement.save()

        if not is_new and old_departement and old_departement.id_departement != self.departement_id:
            old_departement.save()

# ========================
# Pointage
# ========================
class Pointage(models.Model):
    id_pointage = models.CharField(max_length=10, primary_key=True)
    employe = models.ForeignKey('Employe', on_delete=models.CASCADE, related_name="pointages")
    date_pointage = models.DateField(default=date.today)
    heure_entree = models.TimeField()
    heure_sortie = models.TimeField(null=True, blank=True)
    remarque = models.TextField(null=True, blank=True, default="Sans remarque.")
    duree_travail = models.DurationField(null=True, blank=True, editable=False)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_pointages')

    class Meta:
        unique_together = ('employe', 'date_pointage')

    def clean(self):
        if self.heure_sortie and self.heure_entree:
            if self.heure_sortie <= self.heure_entree:
                raise ValidationError("L'heure de sortie doit être après l'heure d'entrée.")
        
        if Pointage.objects.filter(
            employe=self.employe, 
            date_pointage=self.date_pointage
        ).exclude(id_pointage=self.id_pointage).exists():
            raise ValidationError("Un pointage existe déjà pour cet employé à cette date.")
        
        super().clean()

    def save(self, *args, **kwargs):
        if self.heure_entree and self.heure_sortie:
            entree_dt = datetime.combine(self.date_pointage, self.heure_entree)
            sortie_dt = datetime.combine(self.date_pointage, self.heure_sortie)
            self.duree_travail = sortie_dt - entree_dt
        else:
            self.duree_travail = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pointage {self.id_pointage} - {self.employe}"

# ========================
# Evenement
# ========================
class Evenement(models.Model):
    id_evenement = models.CharField(max_length=10, primary_key=True)
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    duree = models.DurationField(editable=False, null=True, blank=True)
    lieu = models.CharField(max_length=200, blank=True, null=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_evenements')

    def clean(self):
        if self.date_fin < self.date_debut:
            raise ValidationError("La date de fin doit être après la date de début")
        super().clean()

    def save(self, *args, **kwargs):
        self.duree = self.date_fin - self.date_debut
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titre} ({self.date_debut} - {self.date_fin})"
    
    
# ========================
# Statistiques
# ========================
class StatistiquesEmploye(models.Model):
    PERIODE_TYPE = [
        ('hebdo', 'Hebdomadaire'),
        ('mensuel', 'Mensuel'),
        ('annuel', 'Annuel')
    ]
    
    employe = models.ForeignKey('Employe', on_delete=models.CASCADE, related_name="statistiques")
    periode_debut = models.DateField()
    periode_fin = models.DateField()
    type_periode = models.CharField(max_length=20, choices=PERIODE_TYPE)
    
    # Statistiques Pointage
    heures_travail_total = models.DurationField(null=True, blank=True)
    jours_travailles = models.IntegerField(default=0)
    moyenne_heures_quotidiennes = models.DurationField(null=True, blank=True)
    pointages_reguliers = models.IntegerField(default=0)
    pointages_irreguliers = models.IntegerField(default=0)
    taux_regularite = models.FloatField(default=0)
    
    jours_ouvrables = models.IntegerField(default=0)
    date_calcul = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_statistiques_employe')
    
    class Meta:
        unique_together = ('employe', 'periode_debut', 'periode_fin', 'type_periode')
        verbose_name = "Statistiques employé"
        verbose_name_plural = "Statistiques employés"
        indexes = [
            models.Index(fields=['employe', 'periode_debut', 'periode_fin']),
            models.Index(fields=['type_periode', 'periode_debut']),
        ]
    
    def __str__(self):
        return f"Stats {self.employe} - {self.periode_debut} à {self.periode_fin}"

class StatistiquesGlobales(models.Model):
    periode = models.DateField(unique=True)  # Premier jour du mois
    type_periode = models.CharField(max_length=20, choices=[('mensuel', 'Mensuel'), ('annuel', 'Annuel')])
    
    # Statistiques Globales
    total_employes = models.IntegerField(default=0)
    employes_actifs = models.IntegerField(default=0)
    total_departements = models.IntegerField(default=0)
    departements_actifs = models.IntegerField(default=0)
    taux_activite_global = models.FloatField(default=0)
    
    # Statistiques Pointage
    total_pointages = models.IntegerField(default=0)
    pointages_reguliers = models.IntegerField(default=0)
    heures_travail_total = models.DurationField(null=True, blank=True)
    moyenne_heures_quotidiennes = models.DurationField(null=True, blank=True)
    taux_presence = models.FloatField(default=0)
    taux_regularite_global = models.FloatField(default=0)
    
    # Statistiques Événements
    total_evenements = models.IntegerField(default=0)
    
    date_calcul = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Statistiques globales"
        verbose_name_plural = "Statistiques globales"
        indexes = [
            models.Index(fields=['periode', 'type_periode']),
        ]
    
    def __str__(self):
        return f"Stats Globales - {self.periode.strftime('%Y-%m')}"