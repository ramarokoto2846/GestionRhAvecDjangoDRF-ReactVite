from rest_framework import serializers
from .models import CustomUser, Departement, Employe, Pointage, Absence, Conge, Evenement, StatistiquesEmploye, StatistiquesDepartement, StatistiquesGlobales
from django.contrib.auth.hashers import make_password

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
    
    class Meta:
        model = Employe
        fields = ['matricule', 'nom', 'prenom', 'nom_complet', 'poste', 'departement']
    
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
# Absence
# -----------------------
class AbsenceSerializer(serializers.ModelSerializer):
    nbr_jours = serializers.IntegerField(read_only=True)
    employe_nom = serializers.CharField(source='employe.nom_complet', read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.email', read_only=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True)

    class Meta:
        model = Absence
        fields = '__all__'

# -----------------------
# Conge
# -----------------------
class CongeSerializer(serializers.ModelSerializer):
    nbr_jours = serializers.IntegerField(read_only=True)
    employe_nom = serializers.CharField(source='employe.nom_complet', read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.email', read_only=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True)

    class Meta:
        model = Conge
        fields = '__all__'
        read_only_fields = ['date_demande', 'date_decision', 'nbr_jours', 'employe_nom', 'created_by']

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

# Service pour formater les durées (identique à celui du frontend)
class StatisticsService:
    @staticmethod
    def format_duration(duration):
        """Formate une durée en chaîne lisible"""
        if not duration:
            return "0h 00min"
        
        if isinstance(duration, str):
            # Si c'est une chaîne, essayer de la parser
            try:
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
            total_seconds = duration.total_seconds()
            hours = int(total_seconds // 3600)
            minutes = int((total_seconds % 3600) // 60)
            return f"{hours}h {minutes:02d}min"
        except:
            return "0h 00min"

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
            'pointages_reguliers', 'pointages_irreguliers',
            
            # Absence
            'taux_absence', 'jours_absence', 'absences_justifiees', 'absences_non_justifiees',
            
            # Congé
            'conges_valides', 'conges_refuses', 'conges_en_attente', 'total_jours_conges',
            'taux_approbation_conges',
            
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

class StatistiquesDepartementSerializer(serializers.ModelSerializer):
    departement = DepartementMinimalSerializer(read_only=True)
    heures_travail_moyennes_str = serializers.SerializerMethodField()
    total_heures_travail_str = serializers.SerializerMethodField()
    mois_display = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.email', read_only=True)
    created_by_nom = serializers.CharField(source='created_by.nom', read_only=True)
    
    class Meta:
        model = StatistiquesDepartement
        fields = [
            'id', 'departement', 'mois', 'mois_display',
            
            # Global
            'total_employes', 'employes_actifs', 'taux_absence_moyen',
            'heures_travail_moyennes', 'heures_travail_moyennes_str',
            
            # Pointage
            'total_heures_travail', 'total_heures_travail_str', 'pointages_total',
            
            # Absence
            'total_absences', 'absences_justifiees', 'absences_non_justifiees',
            
            # Congé
            'total_conges_valides', 'total_conges_refuses', 'total_conges_en_attente',
            'taux_approbation_conges',
            
            'evenements_count', 'date_calcul', 'created_by', 'created_by_username', 'created_by_nom'
        ]
    
    def get_heures_travail_moyennes_str(self, obj):
        return StatisticsService.format_duration(obj.heures_travail_moyennes)
    
    def get_total_heures_travail_str(self, obj):
        return StatisticsService.format_duration(obj.total_heures_travail)
    
    def get_mois_display(self, obj):
        return obj.mois.strftime('%B %Y')

class StatistiquesGlobalesSerializer(serializers.ModelSerializer):
    heures_travail_total_str = serializers.SerializerMethodField()
    periode_display = serializers.SerializerMethodField()
    
    class Meta:
        model = StatistiquesGlobales
        fields = [
            'id', 'periode', 'type_periode', 'periode_display',
            
            # Global
            'total_employes', 'total_departements', 'taux_activite_global',
            
            # Pointage
            'total_pointages', 'heures_travail_total', 'heures_travail_total_str', 'taux_presence',
            
            # Absence
            'total_absences', 'taux_absence_global', 'absences_justifiees',
            
            # Congé
            'total_conges', 'conges_valides', 'conges_refuses', 'taux_validation_conges',
            
            # Événements
            'total_evenements',
            
            'date_calcul'
        ]
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj.heures_travail_total)
    
    def get_periode_display(self, obj):
        return obj.periode.strftime('%B %Y')

# Serializers pour les données calculées (non sauvegardées)
class EmployeeStatsCalculatedSerializer(serializers.Serializer):
    employe = EmployeMinimalSerializer()
    periode_debut = serializers.DateField()
    periode_fin = serializers.DateField()
    type_periode = serializers.CharField()
    
    # Pointage
    heures_travail_total = serializers.DurationField()
    heures_travail_total_str = serializers.SerializerMethodField()
    jours_travailles = serializers.IntegerField()
    moyenne_heures_quotidiennes = serializers.DurationField()
    moyenne_heures_quotidiennes_str = serializers.SerializerMethodField()
    pointages_reguliers = serializers.IntegerField()
    pointages_irreguliers = serializers.IntegerField()
    
    # Absence
    taux_absence = serializers.FloatField()
    jours_absence = serializers.IntegerField()
    absences_justifiees = serializers.IntegerField()
    absences_non_justifiees = serializers.IntegerField()
    
    # Congé
    conges_valides = serializers.IntegerField()
    conges_refuses = serializers.IntegerField()
    conges_en_attente = serializers.IntegerField()
    total_jours_conges = serializers.IntegerField()
    taux_approbation_conges = serializers.FloatField()
    
    jours_ouvrables = serializers.IntegerField()
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj['heures_travail_total'])
    
    def get_moyenne_heures_quotidiennes_str(self, obj):
        return StatisticsService.format_duration(obj['moyenne_heures_quotidiennes'])

class DepartmentStatsCalculatedSerializer(serializers.Serializer):
    departement = DepartementMinimalSerializer()
    mois = serializers.DateField()
    
    # Global
    total_employes = serializers.IntegerField()
    employes_actifs = serializers.IntegerField()
    taux_absence_moyen = serializers.FloatField()
    heures_travail_moyennes = serializers.DurationField()
    heures_travail_moyennes_str = serializers.SerializerMethodField()
    
    # Pointage
    total_heures_travail = serializers.DurationField()
    total_heures_travail_str = serializers.SerializerMethodField()
    pointages_total = serializers.IntegerField()
    
    # Absence
    total_absences = serializers.IntegerField()
    absences_justifiees = serializers.IntegerField()
    absences_non_justifiees = serializers.IntegerField()
    
    # Congé
    total_conges_valides = serializers.IntegerField()
    total_conges_refuses = serializers.IntegerField()
    total_conges_en_attente = serializers.IntegerField()
    taux_approbation_conges = serializers.FloatField()
    
    evenements_count = serializers.IntegerField()
    
    def get_heures_travail_moyennes_str(self, obj):
        return StatisticsService.format_duration(obj['heures_travail_moyennes'])
    
    def get_total_heures_travail_str(self, obj):
        return StatisticsService.format_duration(obj['total_heures_travail'])

class GlobalStatsCalculatedSerializer(serializers.Serializer):
    periode = serializers.DateField()
    type_periode = serializers.CharField()
    periode_display = serializers.SerializerMethodField()
    
    # Global
    total_employes = serializers.IntegerField()
    total_departements = serializers.IntegerField()
    taux_activite_global = serializers.FloatField()
    
    # Pointage
    total_pointages = serializers.IntegerField()
    heures_travail_total = serializers.DurationField()
    heures_travail_total_str = serializers.SerializerMethodField()
    taux_presence = serializers.FloatField()
    
    # Absence
    total_absences = serializers.IntegerField()
    taux_absence_global = serializers.FloatField()
    absences_justifiees = serializers.IntegerField()
    
    # Congé
    total_conges = serializers.IntegerField()
    conges_valides = serializers.IntegerField()
    conges_refuses = serializers.IntegerField()
    taux_validation_conges = serializers.FloatField()
    
    # Événements
    total_evenements = serializers.IntegerField()
    
    def get_heures_travail_total_str(self, obj):
        return StatisticsService.format_duration(obj['heures_travail_total'])
    
    def get_periode_display(self, obj):
        return obj['periode'].strftime('%B %Y')

# Serializers pour statistiques détaillées
class CongeStatisticsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    valides = serializers.IntegerField()
    refuses = serializers.IntegerField()
    en_attente = serializers.IntegerField()
    moyenne_jours = serializers.FloatField()
    total_jours_valides = serializers.IntegerField()
    taux_validation = serializers.SerializerMethodField()
    
    def get_taux_validation(self, obj):
        total_traites = obj['valides'] + obj['refuses']
        return (obj['valides'] / total_traites * 100) if total_traites > 0 else 0

class PointageStatisticsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    heures_total = serializers.DurationField()
    heures_total_str = serializers.SerializerMethodField()
    moyenne_quotidienne = serializers.DurationField()
    moyenne_quotidienne_str = serializers.SerializerMethodField()
    pointages_reguliers = serializers.IntegerField()
    pointages_irreguliers = serializers.IntegerField()
    taux_regularite = serializers.SerializerMethodField()
    
    def get_heures_total_str(self, obj):
        return StatisticsService.format_duration(obj['heures_total'])
    
    def get_moyenne_quotidienne_str(self, obj):
        return StatisticsService.format_duration(obj['moyenne_quotidienne'])
    
    def get_taux_regularite(self, obj):
        return (obj['pointages_reguliers'] / obj['total'] * 100) if obj['total'] > 0 else 0

class AbsenceStatisticsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    jours_total = serializers.IntegerField()
    justifiees = serializers.IntegerField()
    non_justifiees = serializers.IntegerField()
    moyenne_jours = serializers.FloatField()
    taux_justification = serializers.FloatField()