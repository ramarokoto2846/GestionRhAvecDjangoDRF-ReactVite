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
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_absences')

    def clean(self):
        if self.date_fin_absence < self.date_debut_absence:
            raise ValidationError("La date de fin doit être après la date de début")
        
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
    employe = models.ForeignKey('Employe', on_delete=models.CASCADE, related_name="conges")
    date_debut = models.DateField()
    date_fin = models.DateField()
    nbr_jours = models.IntegerField(editable=False)
    motif = models.TextField()
    motif_refus = models.TextField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_VALIDE, default='en_attente')
    date_demande = models.DateTimeField(auto_now_add=True)
    date_decision = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_conges')

    def clean(self):
        if self.date_fin < self.date_debut:
            raise ValidationError("La date de fin doit être après la date de début")
        
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

        old_status = None
        is_update = False

        if self.pk and Conge.objects.filter(pk=self.pk).exists():
            old_instance = Conge.objects.get(pk=self.pk)
            old_status = old_instance.statut
            is_update = True

        if self.statut in ['valide', 'refuse'] and not self.date_decision:
            from django.utils import timezone
            self.date_decision = timezone.now()

        super().save(*args, **kwargs)

        if not is_update or (is_update and old_status != self.statut):
            self._send_notification_email()

    def _send_notification_email(self):
        subject = f"Statut de votre demande de congé #{self.id_conge}"
        if self.statut == 'en_attente':
            message = (
                f"Bonjour {self.employe.nom} {self.employe.prenom},\n\n"
                f"Votre demande de congé (ID: {self.id_conge}) du {self.date_debut} au {self.date_fin} "
                f"a été soumise avec succès et est en attente de validation.\n"
                f"Motif : {self.motif}\n\n"
                f"Vous serez informé(e) de la décision finale.\n\n"
                f"Cordialement,\nL'équipe RH"
            )
        elif self.statut == 'valide':
            message = (
                f"Bonjour {self.employe.nom} {self.employe.prenom},\n\n"
                f"Nous avons le plaisir de vous informer que votre demande de congé (ID: {self.id_conge}) "
                f"du {self.date_debut} au {self.date_fin} a été validée.\n"
                f"Motif : {self.motif}\n"
                f"Nombre de jours : {self.nbr_jours}\n\n"
                f"Cordialement,\nL'équipe RH"
            )
        elif self.statut == 'refuse':
            message = (
                f"Bonjour {self.employe.nom} {self.employe.prenom},\n\n"
                f"Nous sommes désolés de vous informer que votre demande de congé (ID: {self.id_conge}) "
                f"du {self.date_debut} au {self.date_fin} a été refusée.\n"
                f"Motif : {self.motif}\n"
                f"Raison du refus : {self.motif_refus or 'Non spécifiée'}\n"
                f"Pour plus d'informations, veuillez contacter le service RH.\n\n"
                f"Cordialement,\nL'équipe RH"
            )

        try:
            from django.core.mail import send_mail
            from django.conf import settings
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[self.employe.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email pour le congé {self.id_conge}: {str(e)}")

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
# Statistiques (UNIQUEMENT EMPLOYÉ ET GLOBALES)
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
    
    # Statistiques Absence
    taux_absence = models.FloatField(default=0)
    jours_absence = models.IntegerField(default=0)
    absences_justifiees = models.IntegerField(default=0)
    absences_non_justifiees = models.IntegerField(default=0)
    
    # Statistiques Congé
    conges_valides = models.IntegerField(default=0)
    conges_refuses = models.IntegerField(default=0)
    conges_en_attente = models.IntegerField(default=0)
    total_jours_conges = models.IntegerField(default=0)
    taux_approbation_conges = models.FloatField(default=0)
    
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
    total_departements = models.IntegerField(default=0)
    taux_activite_global = models.FloatField(default=0)
    
    # Statistiques Pointage
    total_pointages = models.IntegerField(default=0)
    heures_travail_total = models.DurationField(null=True, blank=True)
    taux_presence = models.FloatField(default=0)
    
    # Statistiques Absence
    total_absences = models.IntegerField(default=0)
    taux_absence_global = models.FloatField(default=0)
    absences_justifiees = models.IntegerField(default=0)
    
    # Statistiques Congé
    total_conges = models.IntegerField(default=0)
    conges_valides = models.IntegerField(default=0)
    conges_refuses = models.IntegerField(default=0)
    taux_validation_conges = models.FloatField(default=0)
    
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