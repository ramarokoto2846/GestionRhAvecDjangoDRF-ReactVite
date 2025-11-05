from rest_framework import serializers
from .models import CustomUser, Departement, Employe, Pointage, Evenement, StatistiquesEmploye, StatistiquesGlobales
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
    departement_nom = serializers.CharField(source='departement.nom', read_only=True)
    
    class Meta:
        model = Employe
        fields = ['matricule', 'nom', 'prenom', 'nom_complet', 'poste', 'departement', 'departement_nom', 'email']
    
    def get_nom_complet(self, obj):
        return f"{obj.nom} {obj.prenom}"

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
    departement = DepartementSerializer(read_only=True)
    departement_pk = serializers.PrimaryKeyRelatedField(
        queryset=Departement.objects.all(),
        source='departement',
        write_only=True
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.email', read_only=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = Employe
        fields = [
            'matricule', 'titre', 'nom', 'prenom', 'nom_complet', 'email', 'telephone', 'poste',
            'statut', 'departement', 'departement_pk', 'user', 'created_by',
            'created_by_username', 'created_by_nom'
        ]
    
    def get_nom_complet(self, obj):
        return f"{obj.nom} {obj.prenom}"

# -----------------------
# Pointage
# -----------------------
class PointageSerializer(serializers.ModelSerializer):
    duree_travail = serializers.DurationField(read_only=True)
    employe_nom = serializers.CharField(source='employe.nom_complet', read_only=True)
    employe_matricule = serializers.CharField(source='employe.matricule', read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.email', read_only=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True)

    class Meta:
        model = Pointage
        fields = '__all__'

# -----------------------
# Evenement
# -----------------------
class EvenementSerializer(serializers.ModelSerializer):
    duree = serializers.DurationField(read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.email', read_only=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True)

    class Meta:
        model = Evenement
        fields = '__all__'

# -----------------------
# Statistiques
# -----------------------

class StatistiquesEmployeSerializer(serializers.ModelSerializer):
    employe = EmployeMinimalSerializer(read_only=True)
    heures_travail_total_str = serializers.SerializerMethodField()
    moyenne_heures_quotidiennes_str = serializers.SerializerMethodField()
    periode_display = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.email', read_only=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True)
    
    class Meta:
        model = StatistiquesEmploye
        fields = [
            'id', 'employe', 'periode_debut', 'periode_fin', 'type_periode', 'periode_display',
            
            # Pointage
            'heures_travail_total', 'heures_travail_total_str', 'jours_travailles',
            'moyenne_heures_quotidiennes', 'moyenne_heures_quotidiennes_str',
            'pointages_reguliers', 'pointages_irreguliers', 'taux_regularite',
            
            'jours_ouvrables', 'date_calcul', 'created_by', 'created_by_username', 'created_by_nom'
        ]
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj.heures_travail_total)
    
    def get_moyenne_heures_quotidiennes_str(self, obj):
        return StatisticsService.format_duration(obj.moyenne_heures_quotidiennes)
    
    def get_periode_display(self, obj):
        if obj.type_periode == 'hebdo':
            return f"Semaine du {obj.periode_debut.strftime('%d/%m/%Y')}"
        else:
            return f"Mois de {obj.periode_debut.strftime('%B %Y')}"

class StatistiquesGlobalesSerializer(serializers.ModelSerializer):
    heures_travail_total_str = serializers.SerializerMethodField()
    periode_display = serializers.SerializerMethodField()
    
    class Meta:
        model = StatistiquesGlobales
        fields = [
            'id', 'periode', 'type_periode', 'periode_display',
            
            # Global
            'total_employes', 'employes_actifs', 'total_departements', 'departements_actifs', 'taux_activite_global',
            
            # Pointage
            'total_pointages', 'pointages_reguliers', 'heures_travail_total', 'heures_travail_total_str',
            'moyenne_heures_quotidiennes', 'taux_presence', 'taux_regularite_global',
            
            # Événements
            'total_evenements',
            
            'date_calcul'
        ]
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj.heures_travail_total)
    
    def get_periode_display(self, obj):
        return obj.periode.strftime('%B %Y')

# Serializers pour les données calculées (non sauvegardées) - CORRIGÉ
class EmployeeStatsCalculatedSerializer(serializers.Serializer):
    # Données de base
    employe = EmployeMinimalSerializer()
    periode_debut = serializers.DateField()
    periode_fin = serializers.DateField()
    type_periode = serializers.CharField()
    
    # Métriques de base - CORRECTION: Ajout des champs manquants
    heures_travail_total = serializers.DurationField()
    heures_travail_total_str = serializers.SerializerMethodField()
    jours_travailles = serializers.IntegerField()
    moyenne_heures_quotidiennes = serializers.DurationField()
    moyenne_heures_quotidiennes_str = serializers.SerializerMethodField()
    
    # Régularité
    pointages_reguliers = serializers.IntegerField()
    pointages_irreguliers = serializers.IntegerField()
    taux_regularite = serializers.FloatField()
    
    # NOUVEAUX CHAMPS AJOUTÉS - CRUCIAUX POUR LE FRONTEND
    # Analyse des heures
    jours_passes_mois = serializers.IntegerField(required=False, allow_null=True)
    heures_attendues_jours_passes = serializers.DurationField(required=False, allow_null=True)
    statut_heures = serializers.CharField(required=False, allow_null=True)
    ecart_heures = serializers.DurationField(required=False, allow_null=True)
    pourcentage_ecart = serializers.FloatField(required=False, allow_null=True)
    observation_heures = serializers.CharField(required=False, allow_null=True)
    
    # Ponctualité - NOUVEAUX CHAMPS
    pointages_ponctuels = serializers.IntegerField(required=False, allow_null=True)
    pointages_non_ponctuels = serializers.IntegerField(required=False, allow_null=True)
    taux_ponctualite = serializers.FloatField(required=False, allow_null=True)
    
    # Présence - NOUVEAU CHAMP
    taux_presence = serializers.FloatField(required=False, allow_null=True)
    
    jours_ouvrables = serializers.IntegerField(required=False, allow_null=True)
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj.get('heures_travail_total'))
    
    def get_moyenne_heures_quotidiennes_str(self, obj):
        return StatisticsService.format_duration(obj.get('moyenne_heures_quotidiennes'))

class GlobalStatsCalculatedSerializer(serializers.Serializer):
    periode = serializers.DateField()
    type_periode = serializers.CharField()
    periode_display = serializers.SerializerMethodField()
    
    # Global
    total_employes = serializers.IntegerField()
    employes_actifs = serializers.IntegerField()
    total_departements = serializers.IntegerField()
    departements_actifs = serializers.IntegerField()
    taux_activite_global = serializers.FloatField()
    
    # Pointage
    total_pointages = serializers.IntegerField()
    pointages_reguliers = serializers.IntegerField()
    heures_travail_total = serializers.DurationField()
    heures_travail_total_str = serializers.SerializerMethodField()
    moyenne_heures_quotidiennes = serializers.DurationField()
    taux_presence = serializers.FloatField()
    taux_regularite_global = serializers.FloatField()
    
    # NOUVEAUX CHAMPS POUR LA PONCTUALITÉ
    pointages_ponctuels = serializers.IntegerField(required=False, allow_null=True)
    taux_ponctualite_global = serializers.FloatField(required=False, allow_null=True)
    
    # Événements
    total_evenements = serializers.IntegerField()
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj.get('heures_travail_total'))
    
    def get_periode_display(self, obj):
        if obj.get('periode'):
            return obj['periode'].strftime('%B %Y')
        return "Période non définie"