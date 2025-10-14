# serializers.py
from rest_framework import serializers
from .models import CustomUser, Departement, Employe, Pointage, Absence, Conge, Evenement
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

    class Meta:
        model = Departement
        fields = '__all__'

# -----------------------
# Employe
# -----------------------
class EmployeSerializer(serializers.ModelSerializer):
    departement = DepartementSerializer(read_only=True)
    departement_pk = serializers.PrimaryKeyRelatedField(
        queryset=Departement.objects.all(),
        source='departement',
        write_only=True
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Employe
        fields = [
            'matricule', 'titre', 'nom', 'prenom', 'email', 'telephone', 'poste',
            'statut', 'departement', 'departement_pk', 'user', 'created_by'
        ]

# -----------------------
# Pointage
# -----------------------
class PointageSerializer(serializers.ModelSerializer):
    duree_travail = serializers.DurationField(read_only=True)
    employe_nom = serializers.CharField(source='employe.nom_complet', read_only=True)
    employe_matricule = serializers.CharField(source='employe.matricule', read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Pointage
        fields = '__all__'

    def validate(self, data):
        heure_entree = data.get('heure_entree')
        heure_sortie = data.get('heure_sortie')
        if heure_entree and heure_sortie:
            if heure_sortie <= heure_entree:
                raise serializers.ValidationError({
                    'heure_sortie': "L'heure de sortie doit être après l'heure d'entrée"
                })
        return data

# -----------------------
# Absence
# -----------------------
class AbsenceSerializer(serializers.ModelSerializer):
    nbr_jours = serializers.IntegerField(read_only=True)
    employe_nom = serializers.CharField(source='employe.nom_complet', read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Absence
        fields = '__all__'

    def validate(self, data):
        if data['date_fin_absence'] < data['date_debut_absence']:
            raise serializers.ValidationError("La date de fin doit être après la date de début")
        return data

# -----------------------
# Conge
# -----------------------
class CongeSerializer(serializers.ModelSerializer):
    nbr_jours = serializers.IntegerField(read_only=True)
    employe_nom = serializers.CharField(source='employe.nom_complet', read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Conge
        fields = '__all__'
        read_only_fields = ['date_demande', 'date_decision', 'nbr_jours', 'employe_nom', 'created_by']

    def validate(self, data):
        if data['date_fin'] < data['date_debut']:
            raise serializers.ValidationError("La date de fin doit être après la date de début")
        return data

# -----------------------
# Evenement
# -----------------------
class EvenementSerializer(serializers.ModelSerializer):
    duree = serializers.DurationField(read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Evenement
        fields = '__all__'

    def validate(self, data):
        if data['date_fin'] < data['date_debut']:
            raise serializers.ValidationError("La date de fin doit être après la date de début")
        return data