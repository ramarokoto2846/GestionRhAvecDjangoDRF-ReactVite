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

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        # Mettre à jour le nombre d'employés
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

    def __str__(self):
        return f"{self.nom} {self.prenom} ({self.matricule})"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        old_departement = None

        # If this is an update, get the current department from the database
        if not is_new:
            try:
                old_instance = Employe.objects.get(pk=self.matricule)
                old_departement = old_instance.departement
            except Employe.DoesNotExist:
                pass

        # Save the employee (updates or creates the record)
        super().save(*args, **kwargs)

        # Update the new department's employee count
        if self.departement_id:
            self.departement.save()

        # If the department changed, update the old department's employee count
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

    class Meta:
        unique_together = ('employe', 'date_pointage')

    def clean(self):
        if self.heure_sortie and self.heure_entree:
            if self.heure_sortie <= self.heure_entree:
                raise ValidationError("L'heure de sortie doit être après l'heure d'entrée.")
        
        # Vérifier s'il existe déjà un pointage pour cet employé à cette date
        if Pointage.objects.filter(
            employe=self.employe, 
            date_pointage=self.date_pointage
        ).exclude(id_pointage=self.id_pointage).exists():
            raise ValidationError("Un pointage existe déjà pour cet employé à cette date.")
        
        super().clean()

    def save(self, *args, **kwargs):
        # Calcul automatique de la durée de travail
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
# Absence
# ========================
class Absence(models.Model):
    id_absence = models.CharField(max_length=10, primary_key=True)
    employe = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name="absences")
    date_debut_absence = models.DateField()
    date_fin_absence = models.DateField()
    nbr_jours = models.IntegerField(editable=False)
    motif = models.TextField()
    justifiee = models.BooleanField(default=False)

    def clean(self):
        if self.date_fin_absence < self.date_debut_absence:
            raise ValidationError("La date de fin doit être après la date de début")
        
        # Vérifier les chevauchements d'absences
        overlapping_absences = Absence.objects.filter(
            employe=self.employe,
            date_debut_absence__lte=self.date_fin_absence,
            date_fin_absence__gte=self.date_debut_absence
        ).exclude(id_absence=self.id_absence)
        
        if overlapping_absences.exists():
            raise ValidationError("Cet employé a déjà une absence sur cette période.")
        
        super().clean()

    def save(self, *args, **kwargs):
        delta = self.date_fin_absence - self.date_debut_absence
        self.nbr_jours = delta.days + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Absence {self.id_absence} - {self.employe}"

# ========================
# Conge
# ========================
class Conge(models.Model):
    STATUT_VALIDE = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('refuse', 'Refusé')
    ]

    id_conge = models.CharField(max_length=10, primary_key=True)
    employe = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name="conges")
    date_debut = models.DateField()
    date_fin = models.DateField()
    nbr_jours = models.IntegerField(editable=False)
    motif = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUT_VALIDE, default='en_attente')
    date_demande = models.DateTimeField(auto_now_add=True)
    date_decision = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.date_fin < self.date_debut:
            raise ValidationError("La date de fin doit être après la date de début")
        
        # Vérifier les chevauchements de congés
        overlapping_conges = Conge.objects.filter(
            employe=self.employe,
            date_debut__lte=self.date_fin,
            date_fin__gte=self.date_debut
        ).exclude(id_conge=self.id_conge)
        
        if overlapping_conges.exists():
            raise ValidationError("Cet employé a déjà un congé sur cette période.")
        
        super().clean()

    def save(self, *args, **kwargs):
        delta = self.date_fin - self.date_debut
        self.nbr_jours = delta.days + 1
        
        # Mettre à jour la date de décision si le statut change
        if self.statut != 'en_attente' and not self.date_decision:
            self.date_decision = datetime.now()
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Congé {self.id_conge} - {self.employe} ({self.statut})"

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

    def clean(self):
        if self.date_fin < self.date_debut:
            raise ValidationError("La date de fin doit être après la date de début")
        super().clean()

    def save(self, *args, **kwargs):
        self.duree = self.date_fin - self.date_debut
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titre} ({self.date_debut} - {self.date_fin})"