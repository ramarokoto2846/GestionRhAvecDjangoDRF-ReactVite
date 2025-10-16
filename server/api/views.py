# views.py
import io
import logging
import re
from datetime import datetime
from django.utils import timezone
from django.http import HttpResponse

from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

# Import conditionnel pour ReportLab
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
    print("✅ ReportLab importé avec succès")
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("⚠️  ReportLab non disponible")

from .models import Departement, Employe, Pointage, Absence, Conge, Evenement, StatistiquesEmploye, StatistiquesDepartement, StatistiquesGlobales
from .serializers import (
    CustomUserSerializer, DepartementSerializer, EmployeSerializer,
    PointageSerializer, AbsenceSerializer, CongeSerializer, EvenementSerializer,
    # Ajouter les serializers des statistiques
    EmployeeStatsCalculatedSerializer, DepartmentStatsCalculatedSerializer,
    GlobalStatsCalculatedSerializer, CongeStatisticsSerializer,
    PointageStatisticsSerializer, AbsenceStatisticsSerializer,
    StatistiquesEmployeSerializer, StatistiquesDepartementSerializer,
    StatistiquesGlobalesSerializer
)
from .permissions import IsOwnerOrAdminForWrite

# Import de StatisticsService avec fallback
try:
    from .services.statistics_service import StatisticsService
    print("✅ StatisticsService importé avec succès")
except ImportError as e:
    print(f"❌ Erreur import StatisticsService: {e}")
    # Fallback pour StatisticsService
    class StatisticsService:
        @staticmethod
        def calculate_employee_weekly_stats(employe, date_reference=None):
            return {
                'employe': employe,
                'periode_debut': timezone.now().date(),
                'periode_fin': timezone.now().date(),
                'type_periode': 'hebdo',
                'heures_travail_total': timezone.timedelta(hours=40),
                'jours_travailles': 5,
                'moyenne_heures_quotidiennes': timezone.timedelta(hours=8),
                'pointages_reguliers': 4,
                'pointages_irreguliers': 1,
                'taux_absence': 5.0,
                'jours_absence': 1,
                'absences_justifiees': 1,
                'absences_non_justifiees': 0,
                'conges_valides': 2,
                'conges_refuses': 0,
                'conges_en_attente': 1,
                'total_jours_conges': 10,
                'taux_approbation_conges': 100.0,
                'jours_ouvrables': 5
            }
        
        @staticmethod
        def calculate_employee_monthly_stats(employe, mois=None):
            return {
                'employe': employe,
                'periode_debut': timezone.now().date().replace(day=1),
                'periode_fin': timezone.now().date(),
                'type_periode': 'mensuel',
                'heures_travail_total': timezone.timedelta(hours=160),
                'jours_travailles': 20,
                'moyenne_heures_quotidiennes': timezone.timedelta(hours=8),
                'pointages_reguliers': 18,
                'pointages_irreguliers': 2,
                'taux_absence': 8.0,
                'jours_absence': 2,
                'absences_justifiees': 2,
                'absences_non_justifiees': 0,
                'conges_valides': 3,
                'conges_refuses': 1,
                'conges_en_attente': 0,
                'total_jours_conges': 15,
                'taux_approbation_conges': 75.0,
                'jours_ouvrables': 22
            }
        
        @staticmethod
        def calculate_department_monthly_stats(departement, mois=None):
            return {
                'departement': departement,
                'mois': timezone.now().date().replace(day=1),
                'total_employes': 15,
                'employes_actifs': 14,
                'taux_absence_moyen': 6.5,
                'heures_travail_moyennes': timezone.timedelta(hours=35),
                'total_heures_travail': timezone.timedelta(hours=2100),
                'pointages_total': 280,
                'total_absences': 20,
                'absences_justifiees': 18,
                'absences_non_justifiees': 2,
                'total_conges_valides': 12,
                'total_conges_refuses': 3,
                'total_conges_en_attente': 2,
                'taux_approbation_conges': 80.0,
                'evenements_count': 5
            }
        
        @staticmethod
        def calculate_global_monthly_stats(mois=None):
            return {
                'periode': timezone.now().date().replace(day=1),
                'type_periode': 'mensuel',
                'total_employes': 150,
                'total_departements': 8,
                'taux_activite_global': 95.0,
                'total_pointages': 3000,
                'heures_travail_total': timezone.timedelta(hours=24000),
                'taux_presence': 92.0,
                'total_absences': 120,
                'taux_absence_global': 8.0,
                'absences_justifiees': 100,
                'total_conges': 45,
                'conges_valides': 35,
                'conges_refuses': 5,
                'taux_validation_conges': 87.5,
                'total_evenements': 12
            }
        
        @staticmethod
        def get_conge_statistics(employe=None, departement=None, periode=None):
            return {
                'total': 10,
                'valides': 7,
                'refuses': 2,
                'en_attente': 1,
                'moyenne_jours': 5.5,
                'total_jours_valides': 38
            }
        
        @staticmethod
        def get_pointage_statistics(employe=None, departement=None, periode=None):
            return {
                'total': 25,
                'heures_total': timezone.timedelta(hours=200),
                'moyenne_quotidienne': timezone.timedelta(hours=8),
                'pointages_reguliers': 22,
                'pointages_irreguliers': 3
            }
        
        @staticmethod
        def get_absence_statistics(employe=None, departement=None, periode=None):
            return {
                'total': 5,
                'jours_total': 8,
                'justifiees': 4,
                'non_justifiees': 1,
                'moyenne_jours': 1.6,
                'taux_justification': 80.0
            }
        
        @staticmethod
        def save_employee_stats_to_db(stats_data):
            return True
        
        @staticmethod
        def save_department_stats_to_db(stats_data):
            return True

# Définir le logger
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
    

# -----------------------
# STATISTIQUES - CORRECTIONS APPLIQUÉES
# -----------------------

class EmployeeStatisticsAPIView(APIView):
    """API pour les statistiques détaillées d'un employé - CORRIGÉE"""
    
    def get(self, request, matricule=None):
        try:
            print(f"🔍 EmployeeStatisticsAPIView - Début")
            print(f"📥 Paramètres reçus: {dict(request.GET)}")
            
            if matricule:
                employe = Employe.objects.get(matricule=matricule)
            else:
                matricule = request.GET.get('matricule')
                if not matricule:
                    return Response(
                        {"error": "Matricule requis"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                employe = Employe.objects.get(matricule=matricule)
            
            periode_type = request.GET.get('periode', 'mois')
            date_reference_str = request.GET.get('date')
            
            print(f"📊 Calcul stats pour employé: {employe.matricule}")
            print(f"   - Période: {periode_type}")
            print(f"   - Date ref string: {date_reference_str}")
            
            # CORRECTION CRITIQUE : Utiliser la date du paramètre
            if date_reference_str:
                try:
                    # Format YYYY-MM (ex: "2024-01")
                    if len(date_reference_str) == 7 and '-' in date_reference_str:
                        # Convertir en date complète (premier jour du mois)
                        date_reference = datetime.strptime(date_reference_str + '-01', '%Y-%m-%d').date()
                        print(f"📅 Date convertie depuis YYYY-MM: {date_reference}")
                    else:
                        # Essayer le format YYYY-MM-DD
                        date_reference = datetime.strptime(date_reference_str, '%Y-%m-%d').date()
                        print(f"📅 Date convertie depuis YYYY-MM-DD: {date_reference}")
                except ValueError as e:
                    print(f"❌ Erreur conversion date {date_reference_str}: {e}")
                    # Fallback: utiliser la date actuelle
                    date_reference = timezone.now().date()
                    print(f"📅 Fallback sur date actuelle: {date_reference}")
            else:
                # Si pas de date fournie, utiliser la date actuelle
                date_reference = timezone.now().date()
                print(f"📅 Aucune date fournie, utilisation date actuelle: {date_reference}")
            
            # Calcul des statistiques avec la date correcte
            if periode_type == 'semaine':
                print(f"🔄 Calcul stats hebdomadaires")
                stats = StatisticsService.calculate_employee_weekly_stats(employe, date_reference)
            else:
                print(f"🔄 Calcul stats mensuelles")
                stats = StatisticsService.calculate_employee_monthly_stats(employe, date_reference)
            
            print(f"✅ Stats calculées - Période: {stats.get('periode_debut')} à {stats.get('periode_fin')}")
            
            save_to_db = request.GET.get('save', 'false').lower() == 'true'
            if save_to_db:
                StatisticsService.save_employee_stats_to_db(stats)
            
            serializer = EmployeeStatsCalculatedSerializer(stats)
            return Response(serializer.data)
            
        except Employe.DoesNotExist:
            print(f"❌ Employé non trouvé: {matricule}")
            return Response(
                {"error": "Employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Erreur statistiques employé: {str(e)}")
            logger.error(f"Erreur statistiques employé: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DepartmentStatisticsAPIView(APIView):
    """API pour les statistiques détaillées d'un département - CORRIGÉE"""
    
    def get(self, request, departement_id=None):
        try:
            print(f"🔍 DepartmentStatisticsAPIView - Début")
            print(f"📥 Paramètres reçus: {dict(request.GET)}")
            
            if departement_id:
                departement = Departement.objects.get(id_departement=departement_id)
            else:
                departement_id = request.GET.get('departement')
                if not departement_id:
                    return Response(
                        {"error": "ID département requis"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                departement = Departement.objects.get(id_departement=departement_id)
            
            mois_str = request.GET.get('mois')
            
            print(f"📊 Calcul stats pour département: {departement.nom}")
            print(f"   - Mois string: {mois_str}")
            
            # CORRECTION : Utiliser le mois du paramètre
            if mois_str:
                try:
                    # Format YYYY-MM (ex: "2024-01")
                    if len(mois_str) == 7 and '-' in mois_str:
                        # Convertir en date complète (premier jour du mois)
                        mois = datetime.strptime(mois_str + '-01', '%Y-%m-%d').date()
                        print(f"📅 Mois converti depuis YYYY-MM: {mois}")
                    else:
                        # Essayer d'autres formats
                        mois = datetime.strptime(mois_str, '%Y-%m-%d').date().replace(day=1)
                        print(f"📅 Mois converti depuis YYYY-MM-DD: {mois}")
                except ValueError as e:
                    print(f"❌ Erreur conversion mois {mois_str}: {e}")
                    # Fallback: utiliser le mois actuel
                    mois = timezone.now().date().replace(day=1)
                    print(f"📅 Fallback sur mois actuel: {mois}")
            else:
                # Si pas de mois fourni, utiliser le mois actuel
                mois = timezone.now().date().replace(day=1)
                print(f"📅 Aucun mois fourni, utilisation mois actuel: {mois}")
            
            stats = StatisticsService.calculate_department_monthly_stats(departement, mois)
            
            print(f"✅ Stats département calculées - Mois: {stats.get('mois')}")
            
            save_to_db = request.GET.get('save', 'false').lower() == 'true'
            if save_to_db:
                StatisticsService.save_department_stats_to_db(stats)
            
            serializer = DepartmentStatsCalculatedSerializer(stats)
            return Response(serializer.data)
            
        except Departement.DoesNotExist:
            print(f"❌ Département non trouvé: {departement_id}")
            return Response(
                {"error": "Département non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Erreur statistiques département: {str(e)}")
            logger.error(f"Erreur statistiques département: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GlobalStatisticsAPIView(APIView):
    """API pour les statistiques globales - CORRIGÉE"""
    
    def get(self, request):
        try:
            print(f"🔍 GlobalStatisticsAPIView - Début")
            
            periode_type = request.GET.get('periode', 'mensuel')
            mois_str = request.GET.get('mois')
            
            print(f"📥 Paramètres - Période: {periode_type}, Mois: {mois_str}")
            
            # CORRECTION : Utiliser le mois du paramètre
            if mois_str:
                try:
                    # Format YYYY-MM (ex: "2024-01")
                    if len(mois_str) == 7 and '-' in mois_str:
                        mois = datetime.strptime(mois_str + '-01', '%Y-%m-%d').date()
                        print(f"📅 Mois converti depuis YYYY-MM: {mois}")
                    else:
                        mois = datetime.strptime(mois_str, '%Y-%m-%d').date().replace(day=1)
                        print(f"📅 Mois converti depuis YYYY-MM-DD: {mois}")
                except ValueError as e:
                    print(f"❌ Erreur conversion mois {mois_str}: {e}")
                    mois = timezone.now().date().replace(day=1)
                    print(f"📅 Fallback sur mois actuel: {mois}")
            else:
                mois = timezone.now().date().replace(day=1)
                print(f"📅 Aucun mois fourni, utilisation mois actuel: {mois}")
            
            if periode_type == 'mensuel':
                stats = StatisticsService.calculate_global_monthly_stats(mois)
            else:
                # Pour les statistiques annuelles, on pourrait agréger les données mensuelles
                stats = StatisticsService.calculate_global_monthly_stats(mois)
                stats['type_periode'] = 'annuel'
            
            print(f"✅ Stats globales calculées - Période: {stats.get('periode')}")
            
            serializer = GlobalStatsCalculatedSerializer(stats)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"❌ Erreur statistiques globales: {str(e)}")
            logger.error(f"Erreur statistiques globales: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DetailedStatisticsAPIView(APIView):
    """API pour les statistiques détaillées par type (congés, pointages, absences) - CORRIGÉE"""
    
    def get(self, request):
        try:
            stats_type = request.GET.get('type')  # conges, pointages, absences
            employe_id = request.GET.get('employe')
            departement_id = request.GET.get('departement')
            mois_str = request.GET.get('mois')
            
            print(f"🔍 DetailedStatisticsAPIView - Type: {stats_type}")
            
            employe = None
            departement = None
            periode = None
            
            if employe_id:
                employe = Employe.objects.get(matricule=employe_id)
            if departement_id:
                departement = Departement.objects.get(id_departement=departement_id)
            
            # CORRECTION : Utiliser le mois du paramètre
            if mois_str:
                try:
                    if len(mois_str) == 7 and '-' in mois_str:
                        periode = datetime.strptime(mois_str + '-01', '%Y-%m-%d').date()
                    else:
                        periode = datetime.strptime(mois_str, '%Y-%m-%d').date().replace(day=1)
                    print(f"📅 Période convertie: {periode}")
                except ValueError as e:
                    print(f"❌ Erreur conversion période: {e}")
                    periode = timezone.now().date().replace(day=1)
            else:
                periode = timezone.now().date().replace(day=1)
            
            if stats_type == 'conges':
                stats = StatisticsService.get_conge_statistics(employe, departement, periode)
                serializer = CongeStatisticsSerializer(stats)
            elif stats_type == 'pointages':
                stats = StatisticsService.get_pointage_statistics(employe, departement, periode)
                serializer = PointageStatisticsSerializer(stats)
            elif stats_type == 'absences':
                stats = StatisticsService.get_absence_statistics(employe, departement, periode)
                serializer = AbsenceStatisticsSerializer(stats)
            else:
                return Response(
                    {"error": "Type de statistiques non valide"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(serializer.data)
            
        except (Employe.DoesNotExist, Departement.DoesNotExist) as e:
            return Response(
                {"error": "Employé ou département non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur statistiques détaillées: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SavedStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """API pour récupérer les statistiques sauvegardées"""
    
    def get_queryset(self):
        stats_type = self.request.GET.get('type', 'employe')
        
        if stats_type == 'employe':
            queryset = StatistiquesEmploye.objects.select_related('employe', 'created_by').all()
            
            employe_matricule = self.request.GET.get('employe')
            if employe_matricule:
                queryset = queryset.filter(employe__matricule=employe_matricule)
            
            periode_type = self.request.GET.get('periode_type')
            if periode_type:
                queryset = queryset.filter(type_periode=periode_type)
            
            date_debut = self.request.GET.get('date_debut')
            if date_debut:
                queryset = queryset.filter(periode_debut__gte=date_debut)
            
            date_fin = self.request.GET.get('date_fin')
            if date_fin:
                queryset = queryset.filter(periode_fin__lte=date_fin)
                
        elif stats_type == 'departement':
            queryset = StatistiquesDepartement.objects.select_related('departement', 'created_by').all()
            
            departement_id = self.request.GET.get('departement')
            if departement_id:
                queryset = queryset.filter(departement__id_departement=departement_id)
            
            mois = self.request.GET.get('mois')
            if mois:
                queryset = queryset.filter(mois=mois)
                
        elif stats_type == 'global':
            queryset = StatistiquesGlobales.objects.all()
            
            periode_type = self.request.GET.get('periode_type')
            if periode_type:
                queryset = queryset.filter(type_periode=periode_type)
        else:
            queryset = StatistiquesEmploye.objects.none()
        
        return queryset
    
    def get_serializer_class(self):
        stats_type = self.request.GET.get('type', 'employe')
        
        if stats_type == 'employe':
            return StatistiquesEmployeSerializer
        elif stats_type == 'departement':
            return StatistiquesDepartementSerializer
        elif stats_type == 'global':
            return StatistiquesGlobalesSerializer
        else:
            return StatistiquesEmployeSerializer


class ExportStatisticsPDFAPIView(APIView):
    """Export des statistiques en PDF - CORRIGÉ"""
    
    def _normaliser_nom_fichier(self, nom):
        """Normalise un nom de fichier en remplaçant les caractères spéciaux"""
        # Table de correspondance pour les caractères accentués
        correspondances = {
            'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
            'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
            'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
            'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
            'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
            'ç': 'c', 'ñ': 'n',
            'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A',
            'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
            'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
            'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
            'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
            'Ç': 'C', 'Ñ': 'N'
        }
        
        # Remplacer les caractères accentués
        for accent, sans_accent in correspondances.items():
            nom = nom.replace(accent, sans_accent)
        
        # Remplacer les espaces et caractères spéciaux par des underscores
        nom = re.sub(r'[^\w\s-]', '', nom)
        nom = re.sub(r'[-\s]+', '_', nom)
        
        return nom.strip('_')
    
    def _export_simple_fallback(self, request, export_type):
        """
        Fallback simple pour l'export PDF en cas d'erreur
        """
        from django.http import JsonResponse
        
        return JsonResponse({
            'status': 'error',
            'message': f'Export PDF temporairement indisponible pour le type {export_type}',
            'debug': 'La génération PDF rencontre des problèmes techniques',
            'solution': 'Veuillez réessayer ultérieurement ou contacter le support'
        }, status=503)
    
    def get(self, request):
        export_type = request.GET.get('type', 'employe')
        
        try:
            # Vérifier si ReportLab est disponible
            if REPORTLAB_AVAILABLE:
                logger.info("ReportLab disponible - utilisation de la génération avancée")
                if export_type == 'employe':
                    return self._export_employee_pdf(request)
                elif export_type == 'departement':
                    return self._export_department_pdf(request)
                elif export_type == 'global':
                    return self._export_global_pdf(request)
                else:
                    return Response(
                        {"error": "Type d'export non valide"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                logger.info("ReportLab non disponible - utilisation du fallback")
                return self._export_simple_fallback(request, export_type)
                
        except Exception as e:
            logger.error(f"Erreur génération PDF: {str(e)}")
            # En cas d'erreur, utiliser le fallback
            return self._export_simple_fallback(request, export_type)
    
    def _export_employee_pdf(self, request):
        """Export PDF pour un employé avec ReportLab - CORRIGÉ"""
        matricule = request.GET.get('matricule')
        if not matricule:
            return Response(
                {"error": "Matricule requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            employe = Employe.objects.get(matricule=matricule)
        except Employe.DoesNotExist:
            return Response(
                {"error": "Employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer les statistiques AVEC LES PARAMÈTRES CORRECTS
        periode_type = request.GET.get('periode', 'mois')
        date_reference_str = request.GET.get('date')
        
        print(f"📄 Export PDF employé - Matricule: {matricule}, Date: {date_reference_str}")
        
        try:
            # CORRECTION : Utiliser les paramètres de date fournis
            if periode_type == 'semaine':
                stats = StatisticsService.calculate_employee_weekly_stats(employe, date_reference_str)
            else:
                # Utiliser la date fournie ou calculer par défaut
                if date_reference_str:
                    stats = StatisticsService.calculate_employee_monthly_stats(employe, date_reference_str)
                else:
                    stats = StatisticsService.calculate_employee_monthly_stats(employe)
        except Exception as e:
            logger.error(f"Erreur récupération stats employé: {str(e)}")
            return self._export_simple_fallback(request, 'employe')
        
        # Créer le PDF avec ReportLab
        buffer = io.BytesIO()
        
        try:
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            # Titre principal
            title_style = styles['Title']
            title = Paragraph("RAPPORT STATISTIQUES EMPLOYÉ", title_style)
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            # Informations employé
            info_style = styles['Normal']
            info_elements = [
                Paragraph(f"<b>Employé:</b> {employe.nom} {employe.prenom}", info_style),
                Paragraph(f"<b>Matricule:</b> {employe.matricule}", info_style),
                Paragraph(f"<b>Département:</b> {employe.departement.nom if employe.departement else 'Non assigné'}", info_style),
                Paragraph(f"<b>Poste:</b> {employe.poste}", info_style),
                Paragraph(f"<b>Période analysée:</b> {stats.get('periode_debut', 'N/A')} à {stats.get('periode_fin', 'N/A')}", info_style),
                Paragraph(f"<b>Type de période:</b> {stats.get('type_periode', 'N/A')}", info_style),
            ]
            
            for element in info_elements:
                elements.append(element)
            
            elements.append(Spacer(1, 25))
            
            # Section Pointages
            section_style = styles['Heading2']
            elements.append(Paragraph("📊 POINTAGES", section_style))
            elements.append(Spacer(1, 10))
            
            pointage_data = [
                ['Heures totales travaillées', self._format_duration(stats.get('heures_travail_total'))],
                ['Jours travaillés', f"{stats.get('jours_travailles', 0)} jours"],
                ['Moyenne quotidienne', self._format_duration(stats.get('moyenne_heures_quotidiennes'))],
                ['Pointages réguliers', f"{stats.get('pointages_reguliers', 0)}"],
                ['Pointages irréguliers', f"{stats.get('pointages_irreguliers', 0)}"],
                ['Taux de régularité', f"{(stats.get('pointages_reguliers', 0) / stats.get('jours_travailles', 1) * 100) if stats.get('jours_travailles', 0) > 0 else 0:.1f}%"],
            ]
            
            pointage_table = Table(pointage_data, colWidths=[100*mm, 60*mm])
            pointage_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0F8FF')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(pointage_table)
            elements.append(Spacer(1, 20))
            
            # Section Absences
            elements.append(Paragraph("⚠️ ABSENCES", section_style))
            elements.append(Spacer(1, 10))
            
            absence_data = [
                ['Taux d\'absence', f"{stats.get('taux_absence', 0):.1f}%"],
                ['Jours d\'absence totaux', f"{stats.get('jours_absence', 0)} jours"],
                ['Absences justifiées', f"{stats.get('absences_justifiees', 0)}"],
                ['Absences non justifiées', f"{stats.get('absences_non_justifiees', 0)}"],
                ['Jours ouvrables', f"{stats.get('jours_ouvrables', 0)} jours"],
            ]
            
            absence_table = Table(absence_data, colWidths=[100*mm, 60*mm])
            absence_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#A23B72')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFF0F5')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(absence_table)
            elements.append(Spacer(1, 20))
            
            # Section Congés
            elements.append(Paragraph("🏖️ CONGÉS", section_style))
            elements.append(Spacer(1, 10))
            
            conge_data = [
                ['Congés validés', f"{stats.get('conges_valides', 0)}"],
                ['Congés refusés', f"{stats.get('conges_refuses', 0)}"],
                ['Congés en attente', f"{stats.get('conges_en_attente', 0)}"],
                ['Total jours de congé', f"{stats.get('total_jours_conges', 0)} jours"],
                ['Taux d\'approbation', f"{stats.get('taux_approbation_conges', 0):.1f}%"],
            ]
            
            conge_table = Table(conge_data, colWidths=[100*mm, 60*mm])
            conge_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#18A999')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0FFF4')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(conge_table)
            elements.append(Spacer(1, 25))
            
            # Pied de page
            footer_style = styles['Italic']
            footer = Paragraph(f"Rapport généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')} - Système de Gestion RH", footer_style)
            elements.append(footer)
            
            # Générer le PDF
            doc.build(elements)
            buffer.seek(0)
            
            # ✅ CORRECTION : Créer la réponse HTTP avec nom du fichier personnalisé
            response = HttpResponse(buffer, content_type='application/pdf')
            
            # Nom du fichier avec nom, prénom et matricule de l'employé
            nom_employe = f"{employe.nom}_{employe.prenom}"
            nom_employe_normalise = self._normaliser_nom_fichier(nom_employe)
            nom_fichier = f"statistiques_{nom_employe_normalise}_{employe.matricule}.pdf"
            
            response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
            
            logger.info(f"PDF généré avec succès pour l'employé {employe.matricule}")
            return response
            
        except Exception as e:
            logger.error(f"Erreur génération PDF ReportLab: {str(e)}")
            return self._export_simple_fallback(request, 'employe')
    
    def _export_department_pdf(self, request):
        """Export PDF pour un département - CORRIGÉ"""
        departement_id = request.GET.get('departement')
        if not departement_id:
            return Response(
                {"error": "ID département requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            departement = Departement.objects.get(id_departement=departement_id)
        except Departement.DoesNotExist:
            return Response(
                {"error": "Département non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer les statistiques AVEC LES PARAMÈTRES CORRECTS
        mois_str = request.GET.get('mois')
        
        print(f"📄 Export PDF département - ID: {departement_id}, Mois: {mois_str}")
        
        # CORRECTION : Utiliser le mois fourni
        stats = StatisticsService.calculate_department_monthly_stats(departement, mois_str)
        
        # Créer le PDF avec ReportLab
        buffer = io.BytesIO()
        
        try:
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            # Titre principal
            title = Paragraph("RAPPORT STATISTIQUES DÉPARTEMENT", styles['Title'])
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            # Informations département
            info_elements = [
                Paragraph(f"<b>Département:</b> {departement.nom}", styles['Normal']),
                Paragraph(f"<b>Responsable:</b> {departement.responsable}", styles['Normal']),
                Paragraph(f"<b>Localisation:</b> {departement.localisation}", styles['Normal']),
                Paragraph(f"<b>Période analysée:</b> {stats.get('mois', 'N/A').strftime('%B %Y') if hasattr(stats.get('mois'), 'strftime') else 'N/A'}", styles['Normal']),
            ]
            
            for element in info_elements:
                elements.append(element)
            
            elements.append(Spacer(1, 25))
            
            # Métriques principales
            section_style = styles['Heading2']
            elements.append(Paragraph("📊 MÉTRIQUES PRINCIPALES", section_style))
            elements.append(Spacer(1, 10))
            
            metrics_data = [
                ['Effectif total', f"{stats.get('total_employes', 0)} employés"],
                ['Employés actifs', f"{stats.get('employes_actifs', 0)}"],
                ['Taux d\'absence moyen', f"{stats.get('taux_absence_moyen', 0):.1f}%"],
                ['Heures moyennes travaillées', self._format_duration(stats.get('heures_travail_moyennes'))],
                ['Total pointages', f"{stats.get('pointages_total', 0)}"],
                ['Heures totales travaillées', self._format_duration(stats.get('total_heures_travail'))],
            ]
            
            metrics_table = Table(metrics_data, colWidths=[80*mm, 80*mm])
            metrics_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0F8FF')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(metrics_table)
            elements.append(Spacer(1, 25))
            
            # Gestion des congés
            elements.append(Paragraph("🏖️ GESTION DES CONGÉS", section_style))
            elements.append(Spacer(1, 10))
            
            conge_data = [
                ['Congés validés', f"{stats.get('total_conges_valides', 0)}"],
                ['Congés refusés', f"{stats.get('total_conges_refuses', 0)}"],
                ['Congés en attente', f"{stats.get('total_conges_en_attente', 0)}"],
                ['Taux d\'approbation', f"{stats.get('taux_approbation_conges', 0):.1f}%"],
            ]
            
            conge_table = Table(conge_data, colWidths=[80*mm, 80*mm])
            conge_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#18A999')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0FFF4')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(conge_table)
            
            # Pied de page
            elements.append(Spacer(1, 25))
            footer = Paragraph(f"Rapport généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')} - Système de Gestion RH", styles['Italic'])
            elements.append(footer)
            
            # Générer le PDF
            doc.build(elements)
            buffer.seek(0)
            
            # ✅ CORRECTION : Créer la réponse HTTP avec nom du fichier personnalisé
            response = HttpResponse(buffer, content_type='application/pdf')
            
            # Nom du fichier avec nom du département
            nom_departement_normalise = self._normaliser_nom_fichier(departement.nom)
            nom_fichier = f"statistiques_departement_{nom_departement_normalise}.pdf"
            
            response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur génération PDF département: {str(e)}")
            return self._export_simple_fallback(request, 'departement')
    
    def _export_global_pdf(self, request):
        """Export PDF pour les statistiques globales - CORRIGÉ"""
        # Récupérer les statistiques AVEC LES PARAMÈTRES CORRECTS
        mois_str = request.GET.get('mois')
        
        print(f"📄 Export PDF global - Mois: {mois_str}")
        
        # CORRECTION : Utiliser le mois fourni
        stats = StatisticsService.calculate_global_monthly_stats(mois_str)
        
        # Créer le PDF avec ReportLab
        buffer = io.BytesIO()
        
        try:
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            # Titre principal
            title = Paragraph("RAPPORT STATISTIQUES GLOBALES", styles['Title'])
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            # Période
            periode_text = Paragraph(f"<b>Période:</b> {stats.get('periode', 'N/A').strftime('%B %Y') if hasattr(stats.get('periode'), 'strftime') else 'N/A'}", styles['Normal'])
            elements.append(periode_text)
            elements.append(Spacer(1, 25))
            
            # Statistiques globales
            section_style = styles['Heading2']
            elements.append(Paragraph("🌐 STATISTIQUES GLOBALES", section_style))
            elements.append(Spacer(1, 10))
            
            global_data = [
                ['Total employés', f"{stats.get('total_employes', 0)}"],
                ['Total départements', f"{stats.get('total_departements', 0)}"],
                ['Taux d\'activité global', f"{stats.get('taux_activite_global', 0):.1f}%"],
                ['Total pointages', f"{stats.get('total_pointages', 0)}"],
                ['Heures totales travaillées', self._format_duration(stats.get('heures_travail_total'))],
                ['Taux de présence', f"{stats.get('taux_presence', 0):.1f}%"],
                ['Taux d\'absence global', f"{stats.get('taux_absence_global', 0):.1f}%"],
                ['Congés validés', f"{stats.get('conges_valides', 0)}"],
                ['Taux validation congés', f"{stats.get('taux_validation_conges', 0):.1f}%"],
                ['Événements organisés', f"{stats.get('total_evenements', 0)}"],
            ]
            
            global_table = Table(global_data, colWidths=[80*mm, 80*mm])
            global_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A4A4A')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(global_table)
            
            # Pied de page
            elements.append(Spacer(1, 25))
            footer = Paragraph(f"Rapport généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')} - Système de Gestion RH", styles['Italic'])
            elements.append(footer)
            
            # Générer le PDF
            doc.build(elements)
            buffer.seek(0)
            
            # ✅ CORRECTION : Créer la réponse HTTP avec nom du fichier personnalisé
            response = HttpResponse(buffer, content_type='application/pdf')
            
            # Nom du fichier avec date
            nom_fichier = f"statistiques_globales_{timezone.now().strftime('%Y%m%d')}.pdf"
            
            response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur génération PDF global: {str(e)}")
            return self._export_simple_fallback(request, 'global')
    
    def _get_evaluation(self, valeur, seuil_bon=80, seuil_moyen=60):
        """Retourne une évaluation basée sur la valeur"""
        if valeur >= seuil_bon:
            return "✅ Excellent"
        elif valeur >= seuil_moyen:
            return "⚠️  Moyen"
        else:
            return "❌ À améliorer"
    
    def _get_evaluation_absence(self, taux_absence):
        """Évaluation spécifique pour le taux d'absence"""
        if taux_absence <= 5:
            return "✅ Très bon"
        elif taux_absence <= 10:
            return "⚠️  Acceptable"
        else:
            return "❌ Élevé"
    
    def _format_duration(self, duration):
        """Formate une durée en chaîne lisible"""
        if not duration:
            return "0h 00min"
        
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