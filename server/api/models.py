

# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.core.validators import RegexValidator, MinLengthValidator
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
# Département
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

    # CIN comme clé primaire (12 chiffres strictement)
    cin = models.CharField(
        max_length=12,
        primary_key=True,
        validators=[
            RegexValidator(
                r'^\d{12}$',
                'Le CIN doit contenir exactement 12 chiffres'
            ),
            MinLengthValidator(12)
        ],
        verbose_name="CIN"
    )
    
    titre = models.CharField(
        max_length=20,
        choices=TITRE_VALIDE,
        default='stagiaire'
    )
    
    # Matricule optionnel, seulement pour les employés fixes
    matricule = models.CharField(
        max_length=6,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^\d{6}$', 'Le matricule doit contenir exactement 6 chiffres')]
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

    # Heures de travail attendues (8h00 - 16h00)
    heure_entree_attendue = models.TimeField(default=time(8, 0))
    heure_sortie_attendue = models.TimeField(default=time(16, 0))
    marge_tolerance_minutes = models.IntegerField(default=10)

    class Meta:
        verbose_name = "Employé"
        verbose_name_plural = "Employés"

    def __str__(self):
        return f"{self.nom} {self.prenom} (CIN: {self.cin})"

    def clean(self):
        super().clean()
        
        # Validation du matricule selon le titre
        if self.titre == 'employe' and not self.matricule:
            raise ValidationError({
                'matricule': 'Le matricule est obligatoire pour les employés fixes'
            })
        
        if self.titre == 'stagiaire' and self.matricule:
            raise ValidationError({
                'matricule': 'Le matricule est réservé aux employés fixes uniquement'
            })
            
        # Vérifier l'unicité du matricule pour les employés fixes
        if self.titre == 'employe' and self.matricule:
            existing = Employe.objects.filter(
                matricule=self.matricule,
                titre='employe'
            ).exclude(cin=self.cin)
            
            if existing.exists():
                raise ValidationError({
                    'matricule': 'Ce matricule est déjà attribué à un autre employé fixe'
                })

    def save(self, *args, **kwargs):
        # Nettoyer le matricule pour les stagiaires
        if self.titre == 'stagiaire':
            self.matricule = None
        
        # Valider avant sauvegarde
        self.full_clean()
        
        is_new = self._state.adding
        old_departement = None

        if not is_new:
            try:
                old_instance = Employe.objects.get(pk=self.cin)
                old_departement = old_instance.departement
            except Employe.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if self.departement_id:
            self.departement.save()

        if not is_new and old_departement and old_departement.id_departement != self.departement_id:
            old_departement.save()

    def get_display_name(self):
        """Retourne le nom d'affichage complet avec titre"""
        titre_display = "Stagiaire" if self.titre == 'stagiaire' else "Employé"
        matricule_display = f" - Mat: {self.matricule}" if self.matricule else ""
        return f"{titre_display}: {self.nom} {self.prenom} (CIN: {self.cin}){matricule_display}"

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
    
    # Nouvelles métriques de ponctualité
    entree_ponctuelle = models.BooleanField(default=False, editable=False)
    sortie_ponctuelle = models.BooleanField(default=False, editable=False)
    ponctualite_statut = models.CharField(max_length=20, default='non_calcule', editable=False)
    retard_minutes = models.IntegerField(default=0, editable=False)
    depart_avance_minutes = models.IntegerField(default=0, editable=False)
    
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

    def _calculer_ponctualite(self):
        """Calcule la ponctualité selon les règles (8h00-16h00 avec marge)"""
        if not self.heure_entree or not self.heure_sortie:
            return
        
        # Heures attendues de l'employé
        heure_entree_attendue = self.employe.heure_entree_attendue or time(8, 0)
        heure_sortie_attendue = self.employe.heure_sortie_attendue or time(16, 0)
        marge = self.employe.marge_tolerance_minutes or 10
        
        # Calcul du retard à l'entrée
        entree_attendu_minutes = heure_entree_attendue.hour * 60 + heure_entree_attendue.minute
        entree_reelle_minutes = self.heure_entree.hour * 60 + self.heure_entree.minute
        
        self.retard_minutes = max(0, entree_reelle_minutes - entree_attendu_minutes)
        self.entree_ponctuelle = self.retard_minutes <= marge
        
        # Calcul du départ anticipé
        sortie_attendu_minutes = heure_sortie_attendue.hour * 60 + heure_sortie_attendue.minute
        sortie_reelle_minutes = self.heure_sortie.hour * 60 + self.heure_sortie.minute
        
        self.depart_avance_minutes = max(0, sortie_attendu_minutes - sortie_reelle_minutes)
        self.sortie_ponctuelle = self.depart_avance_minutes <= marge
        
        # Déterminer le statut de ponctualité
        if self.entree_ponctuelle and self.sortie_ponctuelle:
            self.ponctualite_statut = 'parfait'
        elif self.retard_minutes <= 30 or self.depart_avance_minutes <= 30:
            self.ponctualite_statut = 'acceptable'
        else:
            self.ponctualite_statut = 'inacceptable'

    def save(self, *args, **kwargs):
        if self.heure_entree and self.heure_sortie:
            entree_dt = datetime.combine(self.date_pointage, self.heure_entree)
            sortie_dt = datetime.combine(self.date_pointage, self.heure_sortie)
            self.duree_travail = sortie_dt - entree_dt
            
            # Calculer la ponctualité
            self._calculer_ponctualite()
        else:
            self.duree_travail = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pointage {self.id_pointage} - {self.employe}"

# ========================
# Statistiques Employé
# ========================
class StatistiquesEmploye(models.Model):
    PERIODE_TYPE = [
        ('hebdo', 'Hebdomadaire'),
        ('mensuel', 'Mensuel'),
        ('annuel', 'Annuel')
    ]
    
    REGULARITE_STATUT = [
        ('parfait', 'Parfait'),
        ('acceptable', 'Acceptable'),
        ('inacceptable', 'Inacceptable')
    ]
    
    employe = models.ForeignKey('Employe', on_delete=models.CASCADE, related_name="statistiques")
    periode_debut = models.DateField()
    periode_fin = models.DateField()
    type_periode = models.CharField(max_length=20, choices=PERIODE_TYPE)
    
    # Statistiques Pointage
    heures_travail_total = models.DurationField(null=True, blank=True)
    jours_travailles = models.IntegerField(default=0)
    jours_absents = models.IntegerField(default=0)
    moyenne_heures_quotidiennes = models.DurationField(null=True, blank=True)
    
    # Ponctualité détaillée
    ponctualite_parfaite = models.IntegerField(default=0)  # Entrée et sortie dans la marge
    ponctualite_acceptable = models.IntegerField(default=0)  # Retard <= 30 min
    ponctualite_inacceptable = models.IntegerField(default=0)  # Retard > 30 min
    retard_moyen_minutes = models.FloatField(default=0)
    depart_avance_moyen_minutes = models.FloatField(default=0)
    
    # Nouveau système de régularité
    regularite_statut = models.CharField(max_length=20, choices=REGULARITE_STATUT, default='acceptable')
    taux_regularite = models.FloatField(default=0)
    
    # Présence et absence
    taux_presence = models.FloatField(default=0)
    taux_absence = models.FloatField(default=0)
    
    # Analyse complémentaire
    jours_total = models.IntegerField(default=0)  # Jours totaux dans la période
    heures_attendues = models.DurationField(null=True, blank=True)
    ecart_heures = models.DurationField(null=True, blank=True)
    
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
    
    def calculer_regularite_statut(self):
        """Calcule le statut de régularité basé sur la ponctualité"""
        total_jours = self.ponctualite_parfaite + self.ponctualite_acceptable + self.ponctualite_inacceptable
        
        if total_jours == 0:
            return 'acceptable'
        
        # Pourcentage de ponctualité parfaite
        pourcentage_parfait = (self.ponctualite_parfaite / total_jours) * 100
        
        if pourcentage_parfait >= 80:
            return 'parfait'
        elif pourcentage_parfait >= 60:
            return 'acceptable'
        else:
            return 'inacceptable'

# ========================
# Statistiques Globales
# ========================
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
    ponctualite_parfaite = models.IntegerField(default=0)
    ponctualite_acceptable = models.IntegerField(default=0)
    ponctualite_inacceptable = models.IntegerField(default=0)
    heures_travail_total = models.DurationField(null=True, blank=True)
    moyenne_heures_quotidiennes = models.DurationField(null=True, blank=True)
    
    # Jours analysés
    jours_passes_mois = models.IntegerField(default=0)
    # SUPPRIMER: jours_total_attendus = models.IntegerField(default=0)
    
    # Taux calculés
    taux_presence = models.FloatField(default=0)
    taux_absence_global = models.FloatField(default=0)
    taux_regularite_parfaite = models.FloatField(default=0)
    taux_regularite_acceptable = models.FloatField(default=0)
    taux_regularite_inacceptable = models.FloatField(default=0)
    
    # Absences globales
    total_absences = models.IntegerField(default=0)
    
    # Analyse des heures globales
    heures_attendues_total = models.DurationField(null=True, blank=True)
    statut_heures_global = models.CharField(max_length=20, default='NORMAL')
    ecart_heures_global = models.DurationField(null=True, blank=True)
    pourcentage_ecart_global = models.FloatField(default=0)
    observation_globale = models.TextField(blank=True, null=True)
    
    date_calcul = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Statistiques globales"
        verbose_name_plural = "Statistiques globales"
        indexes = [
            models.Index(fields=['periode', 'type_periode']),
        ]
    
    def __str__(self):
        return f"Stats Globales - {self.periode.strftime('%Y-%m')}"