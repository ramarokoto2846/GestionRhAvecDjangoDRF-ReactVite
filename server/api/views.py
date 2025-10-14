# views.py
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime
from django.utils import timezone
from .models import Departement, Employe, Pointage, Absence, Conge, Evenement
from .serializers import (
    CustomUserSerializer, DepartementSerializer, EmployeSerializer,
    PointageSerializer, AbsenceSerializer, CongeSerializer, EvenementSerializer
)
from .permissions import IsOwnerOrAdminForWrite
import logging

# Définir le logger au début du fichier
logger = logging.getLogger(__name__)

# -----------------------
# Utilisateur courant
# -----------------------
class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

# -----------------------
# Inscription
# -----------------------
class RegisterViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(CustomUserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# -----------------------
# Departement
# -----------------------
class DepartementViewSet(viewsets.ModelViewSet):
    queryset = Departement.objects.all()
    serializer_class = DepartementSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['nom', 'responsable', 'localisation']
    filterset_fields = ['nom']
    ordering_fields = ['nom', 'nbr_employe']
    ordering = ['nom']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# -----------------------
# Employe
# -----------------------
class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.select_related('departement').all()
    serializer_class = EmployeSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['nom', 'prenom', 'email', 'matricule', 'poste']
    filterset_fields = ['departement', 'statut', 'titre']
    ordering_fields = ['nom', 'prenom', 'matricule']
    ordering = ['nom', 'prenom']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_employes = Employe.objects.count()
        employes_actifs = Employe.objects.filter(statut='actif').count()
        employes_inactifs = Employe.objects.filter(statut='inactif').count()
        return Response({
            'total_employes': total_employes,
            'employes_actifs': employes_actifs,
            'employes_inactifs': employes_inactifs
        })

# -----------------------
# Pointage
# -----------------------
class PointageViewSet(viewsets.ModelViewSet):
    queryset = Pointage.objects.select_related('employe').all()
    serializer_class = PointageSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['employe__nom', 'employe__prenom', 'remarque']
    filterset_fields = ['date_pointage', 'employe']
    ordering_fields = ['date_pointage', 'heure_entree']
    ordering = ['-date_pointage', 'heure_entree']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def stats_mensuelles(self, request):
        mois = int(request.query_params.get('mois', datetime.now().month))
        annee = int(request.query_params.get('annee', datetime.now().year))
        pointages = Pointage.objects.filter(
            date_pointage__year=annee,
            date_pointage__month=mois,
            duree_travail__isnull=False
        )
        total_heures = sum([p.duree_travail.total_seconds() for p in pointages]) / 3600
        return Response({
            'mois': mois,
            'annee': annee,
            'total_heures': total_heures,
            'nombre_pointages': pointages.count()
        })

# -----------------------
# Absence
# -----------------------
class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.select_related('employe').all()
    serializer_class = AbsenceSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['employe__nom', 'employe__prenom', 'motif']
    filterset_fields = ['date_debut_absence', 'date_fin_absence', 'justifiee', 'employe']
    ordering_fields = ['date_debut_absence', 'date_fin_absence']
    ordering = ['-date_debut_absence']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# -----------------------
# Conge
# -----------------------
class CongeViewSet(viewsets.ModelViewSet):
    queryset = Conge.objects.select_related('employe').all()
    serializer_class = CongeSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['employe__nom', 'employe__prenom', 'motif']
    filterset_fields = ['date_debut', 'date_fin', 'statut', 'employe']
    ordering_fields = ['date_debut', 'date_fin', 'statut']
    ordering = ['-date_demande']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        logger.info(f"Requête reçue pour valider le congé {pk} par l'utilisateur {request.user.email}")
        try:
            conge = self.get_object()
            conge.statut = 'valide'
            conge.date_decision = timezone.now()
            conge.save()
            logger.info(f"Congé {pk} validé avec succès")
            return Response({
                'status': 'congé validé',
                'message': f"Un email de notification a été envoyé à {conge.employe.email}."
            })
        except Exception as e:
            logger.error(f"Erreur lors de la validation du congé {pk}: {str(e)}")
            return Response(
                {'error': f"Erreur lors de la validation du congé: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        logger.info(f"Requête reçue pour refuser le congé {pk} par l'utilisateur {request.user.email}")
        try:
            conge = self.get_object()
            motif_refus = request.data.get('motif_refus')
            if not motif_refus:
                logger.error("Motif de refus non fourni")
                return Response(
                    {'error': 'La raison du refus est requise.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            conge.statut = 'refuse'
            conge.date_decision = timezone.now()
            conge.motif_refus = motif_refus
            conge.save()
            logger.info(f"Congé {pk} refusé avec succès")
            return Response({
                'status': 'congé refusé',
                'message': f"Un email de notification a été envoyé à {conge.employe.email}.",
                'motif_refus': conge.motif_refus or 'Non spécifiée'
            })
        except Exception as e:
            logger.error(f"Erreur lors du refus du congé {pk}: {str(e)}")
            return Response(
                {'error': f"Erreur lors du refus du congé: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

# -----------------------
# Evenement
# -----------------------
class EvenementViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    permission_classes = [IsOwnerOrAdminForWrite]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['titre', 'description', 'lieu']
    filterset_fields = ['date_debut', 'date_fin']
    ordering_fields = ['date_debut', 'date_fin']
    ordering = ['date_debut']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def a_venir(self, request):
        evenements = Evenement.objects.filter(date_debut__gte=datetime.now())
        serializer = self.get_serializer(evenements, many=True)
        return Response(serializer.data)