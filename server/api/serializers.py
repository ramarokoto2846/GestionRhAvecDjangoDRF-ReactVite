# serializers.py
from rest_framework import serializers
from .models import CustomUser, Departement, Employe, Pointage, StatistiquesEmploye, StatistiquesGlobales
from django.contrib.auth.hashers import make_password

# Service pour formater les durées
class StatisticsService:
    @staticmethod
    def format_duration(duration):
        """Formate une durée en chaîne lisible"""
        if not duration:
            return "0h 00min"
        
        if isinstance(duration, str):
            try:
                # Gérer le format "1 day, 08:14:00" de Django
                if 'day' in duration:
                    parts = duration.split(', ')
                    if len(parts) == 2:
                        days = int(parts[0].split()[0]) if 'day' in parts[0] else 0
                        time_parts = parts[1].split(':')
                        if len(time_parts) >= 2:
                            hours = int(time_parts[0]) + (days * 24)
                            minutes = int(time_parts[1])
                            return f"{hours}h {minutes:02d}min"
                # Format simple "HH:MM:SS"
                parts = duration.split(':')
                if len(parts) >= 2:
                    hours = int(parts[0])
                    minutes = int(parts[1])
                    return f"{hours}h {minutes:02d}min"
            except:
                return duration
            return duration
        
        # Si c'est un timedelta
        try:
            if hasattr(duration, 'total_seconds'):
                total_seconds = duration.total_seconds()
            else:
                total_seconds = float(duration)
            
            hours = int(total_seconds // 3600)
            minutes = int((total_seconds % 3600) // 60)
            return f"{hours}h {minutes:02d}min"
        except:
            return "0h 00min"

# -----------------------
# CustomUser
# -----------------------
class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password', 'nom', 'is_staff', 'is_superuser']
        read_only_fields = ['is_staff', 'is_superuser']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data.get('password'))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data.get('password'))
        return super().update(instance, validated_data)

# -----------------------
# Departement
# -----------------------
class DepartementSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.email', read_only=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True)

    class Meta:
        model = Departement
        fields = [
            'id_departement', 'nom', 'responsable', 'description', 
            'nbr_employe', 'localisation', 'created_by', 
            'created_by_username', 'created_by_nom'
        ]

# -----------------------
# Employe - Minimal (pour les relations)
# -----------------------
class EmployeMinimalSerializer(serializers.ModelSerializer):
    nom_complet = serializers.SerializerMethodField()
    departement_nom = serializers.CharField(source='departement.nom', read_only=True, allow_null=True)
    matricule_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Employe
        fields = ['cin', 'matricule', 'matricule_display', 'nom', 'prenom', 'nom_complet', 
                 'poste', 'departement', 'departement_nom', 'email', 'titre']
    
    def get_nom_complet(self, obj):
        return f"{obj.nom} {obj.prenom}"
    
    def get_matricule_display(self, obj):
        if obj.titre == 'employe' and obj.matricule:
            return obj.matricule
        return "Stagiaire"

# -----------------------
# Departement - Minimal (pour les relations)
# -----------------------
class DepartementMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departement
        fields = ['id_departement', 'nom', 'responsable']

# -----------------------
# Employe - Complet
# -----------------------
class EmployeSerializer(serializers.ModelSerializer):
    # Pour l'affichage (lecture)
    departement_info = DepartementMinimalSerializer(source='departement', read_only=True)
    
    # Pour l'écriture
    departement = serializers.PrimaryKeyRelatedField(
        queryset=Departement.objects.all(),
        required=False,
        allow_null=True
    )
    
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.email', read_only=True, allow_null=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True, allow_null=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    nom_complet = serializers.SerializerMethodField()
    matricule_display = serializers.SerializerMethodField()
    titre_display = serializers.CharField(source='get_titre_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Employe
        fields = [
            'cin', 'titre', 'titre_display', 'matricule', 'matricule_display',
            'nom', 'prenom', 'nom_complet', 'email', 'telephone', 'poste',
            'statut', 'statut_display', 'departement', 'departement_info', 
            'user', 'created_by', 'created_by_username', 'created_by_nom',
            'heure_entree_attendue', 'heure_sortie_attendue', 'marge_tolerance_minutes'
        ]
    
    def get_nom_complet(self, obj):
        return f"{obj.nom} {obj.prenom}"
    
    def get_matricule_display(self, obj):
        if obj.titre == 'employe' and obj.matricule:
            return obj.matricule
        return "Stagiaire"
    
    def validate(self, data):
        # Validation personnalisée pour le matricule selon le titre
        titre = data.get('titre')
        matricule = data.get('matricule')
        
        if titre == 'employe' and not matricule:
            raise serializers.ValidationError({
                'matricule': 'Le matricule est obligatoire pour les employés fixes'
            })
        
        if titre == 'stagiaire' and matricule:
            raise serializers.ValidationError({
                'matricule': 'Le matricule est réservé aux employés fixes uniquement'
            })
        
        # Vérifier l'unicité du matricule pour les employés fixes
        if titre == 'employe' and matricule:
            instance_cin = self.instance.cin if self.instance else None
            existing = Employe.objects.filter(
                matricule=matricule,
                titre='employe'
            ).exclude(cin=instance_cin)
            
            if existing.exists():
                raise serializers.ValidationError({
                    'matricule': 'Ce matricule est déjà attribué à un autre employé fixe'
                })
        
        return data
    
    def create(self, validated_data):
        # Nettoyer le matricule pour les stagiaires
        if validated_data.get('titre') == 'stagiaire':
            validated_data['matricule'] = None
        
        # Ajouter l'utilisateur courant comme créateur
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Nettoyer le matricule pour les stagiaires
        if validated_data.get('titre') == 'stagiaire':
            validated_data['matricule'] = None
        
        return super().update(instance, validated_data)

# -----------------------
# Pointage
# -----------------------
class PointageSerializer(serializers.ModelSerializer):
    duree_travail = serializers.DurationField(read_only=True)
    employe_nom = serializers.CharField(source='employe.nom_complet', read_only=True)
    employe_cin = serializers.CharField(source='employe.cin', read_only=True)
    employe_matricule = serializers.SerializerMethodField(read_only=True)
    ponctualite_statut_display = serializers.CharField(source='get_ponctualite_statut_display', read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.email', read_only=True, allow_null=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True, allow_null=True)

    class Meta:
        model = Pointage
        fields = '__all__'
    
    def get_employe_matricule(self, obj):
        return obj.employe.matricule if obj.employe.titre == 'employe' else "Stagiaire"

# -----------------------
# Statistiques Employé (sauvegardées)
# -----------------------
class StatistiquesEmployeSerializer(serializers.ModelSerializer):
    employe = EmployeMinimalSerializer(read_only=True)
    heures_travail_total_str = serializers.SerializerMethodField()
    moyenne_heures_quotidiennes_str = serializers.SerializerMethodField()
    periode_display = serializers.SerializerMethodField()
    regularite_statut_display = serializers.CharField(source='get_regularite_statut_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.email', read_only=True, allow_null=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True, allow_null=True)
    
    class Meta:
        model = StatistiquesEmploye
        fields = [
            'id', 'employe', 'periode_debut', 'periode_fin', 'type_periode', 'periode_display',
            
            # Pointage
            'heures_travail_total', 'heures_travail_total_str', 'jours_travailles',
            'jours_absents', 'moyenne_heures_quotidiennes', 'moyenne_heures_quotidiennes_str',
            
            # Ponctualité détaillée
            'ponctualite_parfaite', 'ponctualite_acceptable', 'ponctualite_inacceptable',
            'retard_moyen_minutes', 'depart_avance_moyen_minutes',
            
            # Régularité
            'regularite_statut', 'regularite_statut_display', 'taux_regularite',
            
            # Présence et absence
            'taux_presence', 'taux_absence',
            
            # Analyse complémentaire
            'heures_attendues', 'ecart_heures', 'jours_total',
            
            'date_calcul', 'created_by', 'created_by_username', 'created_by_nom'
        ]
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj.heures_travail_total)
    
    def get_moyenne_heures_quotidiennes_str(self, obj):
        return StatisticsService.format_duration(obj.moyenne_heures_quotidiennes)
    
    def get_periode_display(self, obj):
        if obj.type_periode == 'hebdo':
            return f"Semaine du {obj.periode_debut.strftime('%d/%m/%Y')}"
        elif obj.type_periode == 'mensuel':
            return f"Mois de {obj.periode_debut.strftime('%B %Y')}"
        else:
            return f"Année {obj.periode_debut.year}"

# -----------------------
# Statistiques Globales (sauvegardées)
# -----------------------
class StatistiquesGlobalesSerializer(serializers.ModelSerializer):
    heures_travail_total_str = serializers.SerializerMethodField()
    periode_display = serializers.SerializerMethodField()
    
    class Meta:
        model = StatistiquesGlobales
        fields = [
            'id', 'periode', 'type_periode', 'periode_display',
            
            # Global
            'total_employes', 'employes_actifs', 'total_departements', 
            'departements_actifs', 'taux_activite_global',
            
            # Jours analysés
            'jours_passes_mois',
            # SUPPRIMER: 'jours_total_attendus',
            
            # Pointage et ponctualité
            'total_pointages', 'ponctualite_parfaite', 'ponctualite_acceptable', 
            'ponctualite_inacceptable', 'heures_travail_total', 'heures_travail_total_str',
            'moyenne_heures_quotidiennes', 'taux_presence',
            
            # Régularité
            'taux_regularite_parfaite', 'taux_regularite_acceptable', 
            'taux_regularite_inacceptable',
            
            # Absences
            'total_absences', 'taux_absence_global',
            
            # Analyse des heures globales
            'heures_attendues_total', 'statut_heures_global',
            'ecart_heures_global', 'pourcentage_ecart_global',
            'observation_globale',
            
            'date_calcul'
        ]
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj.heures_travail_total)
    
    def get_periode_display(self, obj):
        return obj.periode.strftime('%B %Y')


# -----------------------
# Serializers pour les données calculées (non sauvegardées)
# -----------------------
class EmployeeStatsCalculatedSerializer(serializers.Serializer):
    # Données de base
    employe = EmployeMinimalSerializer()
    periode_debut = serializers.DateField()
    periode_fin = serializers.DateField()
    type_periode = serializers.CharField()
    
    # Métriques de base
    heures_travail_total = serializers.DurationField()
    heures_travail_total_str = serializers.SerializerMethodField()
    jours_travailles = serializers.IntegerField()
    jours_absents = serializers.IntegerField(default=0)
    moyenne_heures_quotidiennes = serializers.DurationField()
    moyenne_heures_quotidiennes_str = serializers.SerializerMethodField()
    
    # Ponctualité détaillée
    ponctualite_parfaite = serializers.IntegerField(default=0)
    ponctualite_acceptable = serializers.IntegerField(default=0)
    ponctualite_inacceptable = serializers.IntegerField(default=0)
    retard_moyen_minutes = serializers.FloatField(default=0)
    depart_avance_moyen_minutes = serializers.FloatField(default=0)
    
    # Régularité
    regularite_statut = serializers.CharField(default='acceptable')
    taux_regularite = serializers.FloatField(default=0)
    
    # Analyse des heures
    jours_passes_mois = serializers.IntegerField(required=False, allow_null=True)
    jours_total_passes = serializers.IntegerField(required=False, allow_null=True)
    heures_attendues_jours_passes = serializers.DurationField(required=False, allow_null=True)
    statut_heures = serializers.CharField(required=False, allow_null=True)
    ecart_heures = serializers.DurationField(required=False, allow_null=True)
    pourcentage_ecart = serializers.FloatField(required=False, allow_null=True)
    observation_heures = serializers.CharField(required=False, allow_null=True)
    
    # Présence et absence
    taux_presence = serializers.FloatField(required=False, allow_null=True)
    taux_absence = serializers.FloatField(required=False, allow_null=True, default=0)
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj.get('heures_travail_total'))
    
    def get_moyenne_heures_quotidiennes_str(self, obj):
        return StatisticsService.format_duration(obj.get('moyenne_heures_quotidiennes'))

# serializers.py - Modifier GlobalStatsCalculatedSerializer

class GlobalStatsCalculatedSerializer(serializers.Serializer):
    periode = serializers.DateField()
    type_periode = serializers.CharField()
    periode_display = serializers.SerializerMethodField()
    
    # Jours analysés
    jours_passes_mois = serializers.IntegerField(default=0)
    # SUPPRIMER: jours_total_attendus = serializers.IntegerField(default=0)
    
    # Global
    total_employes = serializers.IntegerField()
    employes_actifs = serializers.IntegerField()
    total_departements = serializers.IntegerField()
    departements_actifs = serializers.IntegerField()
    taux_activite_global = serializers.FloatField()
    
    # Pointage et ponctualité
    total_pointages = serializers.IntegerField()
    ponctualite_parfaite = serializers.IntegerField(default=0)
    ponctualite_acceptable = serializers.IntegerField(default=0)
    ponctualite_inacceptable = serializers.IntegerField(default=0)
    heures_travail_total = serializers.DurationField()
    heures_travail_total_str = serializers.SerializerMethodField()
    moyenne_heures_quotidiennes = serializers.DurationField()
    
    # Régularité
    taux_regularite_parfaite = serializers.FloatField(default=0)
    taux_regularite_acceptable = serializers.FloatField(default=0)
    taux_regularite_inacceptable = serializers.FloatField(default=0)
    
    # Présence et absence
    taux_presence = serializers.FloatField()
    taux_absence_global = serializers.FloatField(default=0)
    total_absences = serializers.IntegerField(default=0)
    
    # Analyse des heures globales
    heures_attendues_total = serializers.DurationField(required=False, allow_null=True)
    statut_heures_global = serializers.CharField(required=False, allow_null=True)
    ecart_heures_global = serializers.DurationField(required=False, allow_null=True)
    pourcentage_ecart_global = serializers.FloatField(required=False, allow_null=True)
    observation_globale = serializers.CharField(required=False, allow_null=True)
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj.get('heures_travail_total'))
    
    def get_periode_display(self, obj):
        if obj.get('periode'):
            return obj['periode'].strftime('%B %Y')
        return "Période non définie"