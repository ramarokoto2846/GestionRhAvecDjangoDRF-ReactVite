# views.py
import io
import logging
import re
import json
from datetime import datetime, timedelta, time
from django.utils import timezone
from django.http import HttpResponse, JsonResponse

from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mail
from django.conf import settings

# Import conditionnel pour ReportLab
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm, inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from .models import Departement, Employe, Pointage, StatistiquesEmploye, StatistiquesGlobales
from .serializers import (
    CustomUserSerializer, DepartementSerializer, EmployeSerializer,
    PointageSerializer, StatistiquesEmployeSerializer, StatistiquesGlobalesSerializer,
    EmployeeStatsCalculatedSerializer, GlobalStatsCalculatedSerializer
)
from .permissions import IsOwnerOrAdminForWrite, IsAuthenticatedCRUD, IsOwnerOrReadOnlyForSelf

# Import de StatisticsService
from .services.statistics_service import StatisticsService

logger = logging.getLogger(__name__)

def parse_date(date_str):
    """Parse une date depuis une chaîne"""
    if not date_str:
        return None
    try:
        if isinstance(date_str, str):
            for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
                try:
                    return datetime.strptime(date_str, fmt).date()
                except ValueError:
                    continue
            return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
        return date_str
    except Exception:
        return None

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

class RegisterViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(CustomUserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.select_related('departement').all()
    serializer_class = EmployeSerializer
    permission_classes = [IsAuthenticatedCRUD]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['nom', 'prenom', 'email', 'cin', 'matricule', 'poste']
    filterset_fields = ['departement', 'statut', 'titre']
    ordering_fields = ['nom', 'prenom', 'cin']
    ordering = ['nom', 'prenom']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrer par type d'employé si spécifié
        employe_type = self.request.query_params.get('type')
        if employe_type:
            if employe_type == 'stagiaire':
                queryset = queryset.filter(titre='stagiaire')
            elif employe_type == 'employe':
                queryset = queryset.filter(titre='employe')
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_employes = Employe.objects.count()
        employes_actifs = Employe.objects.filter(statut='actif').count()
        employes_inactifs = Employe.objects.filter(statut='inactif').count()
        
        # Statistiques par type
        stagiaires_actifs = Employe.objects.filter(titre='stagiaire', statut='actif').count()
        employes_fixes_actifs = Employe.objects.filter(titre='employe', statut='actif').count()
        
        return Response({
            'total_employes': total_employes,
            'employes_actifs': employes_actifs,
            'employes_inactifs': employes_inactifs,
            'stagiaires_actifs': stagiaires_actifs,
            'employes_fixes_actifs': employes_fixes_actifs,
            'pourcentage_stagiaires': round((stagiaires_actifs / total_employes * 100) if total_employes > 0 else 0, 2),
            'pourcentage_employes_fixes': round((employes_fixes_actifs / total_employes * 100) if total_employes > 0 else 0, 2)
        })

class PointageViewSet(viewsets.ModelViewSet):
    queryset = Pointage.objects.select_related('employe').all()
    serializer_class = PointageSerializer
    permission_classes = [IsAuthenticatedCRUD]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['employe__nom', 'employe__prenom', 'remarque']
    filterset_fields = ['date_pointage', 'employe']
    ordering_fields = ['date_pointage', 'heure_entree']
    ordering = ['-date_pointage', 'heure_entree']

    def create(self, request, *args, **kwargs):
        employe_cin = request.data.get('employe')
        if employe_cin:
            try:
                employe = Employe.objects.get(cin=employe_cin)
                if employe.statut != 'actif':
                    return Response(
                        {"error": "Les employés inactifs ne peuvent pas effectuer de pointage."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Vérifier que l'utilisateur peut pointer pour cet employé
                if not (request.user.is_superuser or employe.created_by == request.user):
                    return Response(
                        {"error": "Vous ne pouvez pointer que pour vos propres employés."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
            except Employe.DoesNotExist:
                return Response(
                    {"error": "Employé non trouvé."},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return super().create(request, *args, **kwargs)

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

class StatistiquesEmployeViewSet(viewsets.ReadOnlyModelViewSet):
    """Vue pour les statistiques employés sauvegardées"""
    queryset = StatistiquesEmploye.objects.select_related('employe', 'created_by').all()
    serializer_class = StatistiquesEmployeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['employe__nom', 'employe__prenom', 'employe__cin']
    filterset_fields = ['employe', 'type_periode', 'periode_debut', 'periode_fin']
    ordering_fields = ['periode_debut', 'date_calcul']
    ordering = ['-periode_debut', '-date_calcul']

class StatistiquesGlobalesViewSet(viewsets.ReadOnlyModelViewSet):
    """Vue pour les statistiques globales sauvegardées"""
    queryset = StatistiquesGlobales.objects.all()
    serializer_class = StatistiquesGlobalesSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type_periode', 'periode']
    ordering_fields = ['periode', 'date_calcul']
    ordering = ['-periode', '-date_calcul']

class EmployeeStatisticsAPIView(APIView):
    """API pour les statistiques employés calculées en temps réel avec nouveau système"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, cin=None):
        try:
            if cin:
                employe = Employe.objects.get(cin=cin)
            else:
                cin = request.GET.get('cin')
                if not cin:
                    return Response(
                        {"error": "CIN requis"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                employe = Employe.objects.get(cin=cin)
            
            # Vérifier que l'utilisateur a accès à ces statistiques
            if not (request.user.is_superuser or employe.created_by == request.user):
                return Response(
                    {"error": "Vous n'avez pas accès aux statistiques de cet employé."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            periode_type = request.GET.get('periode', 'mois')
            date_reference_str = request.GET.get('date')
            
            if date_reference_str:
                try:
                    if len(date_reference_str) == 7 and '-' in date_reference_str:
                        date_reference = datetime.strptime(date_reference_str + '-01', '%Y-%m-%d').date()
                    else:
                        date_reference = datetime.strptime(date_reference_str, '%Y-%m-%d').date()
                except ValueError as e:
                    date_reference = timezone.now().date()
            else:
                date_reference = timezone.now().date()
            
            if periode_type == 'semaine':
                stats = StatisticsService.calculate_employee_weekly_stats(employe, date_reference)
            else:
                stats = StatisticsService.calculate_employee_monthly_stats(employe, date_reference)
            
            save_to_db = request.GET.get('save', 'false').lower() == 'true'
            if save_to_db:
                StatisticsService.save_employee_stats_to_db(stats)
            
            serializer = EmployeeStatsCalculatedSerializer(stats)
            return Response(serializer.data)
            
        except Employe.DoesNotExist:
            return Response(
                {"error": "Employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur statistiques employé: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GlobalStatisticsAPIView(APIView):
    """API pour les statistiques globales calculées en temps réel avec nouveau système"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            periode_type = request.GET.get('periode', 'mensuel')
            mois_str = request.GET.get('mois')
            
            if mois_str:
                try:
                    if len(mois_str) == 7 and '-' in mois_str:
                        mois = datetime.strptime(mois_str + '-01', '%Y-%m-%d').date()
                    else:
                        mois = datetime.strptime(mois_str, '%Y-%m-%d').date().replace(day=1)
                except ValueError as e:
                    mois = timezone.now().date().replace(day=1)
            else:
                mois = timezone.now().date().replace(day=1)
            
            if periode_type == 'mensuel':
                stats = StatisticsService.calculate_global_monthly_stats(mois)
            else:
                stats = StatisticsService.calculate_global_monthly_stats(mois)
                stats['type_periode'] = 'annuel'
            
            serializer = GlobalStatsCalculatedSerializer(stats)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Erreur statistiques globales: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EmployeePonctualiteAnalysisAPIView(APIView):
    """Analyse détaillée de la ponctualité d'un employé avec nouveau système"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, cin=None):
        try:
            if not cin:
                cin = request.GET.get('cin')
                if not cin:
                    return Response(
                        {"error": "CIN requis"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            employe = Employe.objects.get(cin=cin)
            
            # Vérifier que l'utilisateur a accès
            if not (request.user.is_superuser or employe.created_by == request.user):
                return Response(
                    {"error": "Vous n'avez pas accès à l'analyse de cet employé."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            periode_type = request.GET.get('periode', 'mois')
            date_reference_str = request.GET.get('date')
            
            # Calculer les stats principales
            if periode_type == 'semaine':
                stats = StatisticsService.calculate_employee_weekly_stats(employe, date_reference_str)
            else:
                stats = StatisticsService.calculate_employee_monthly_stats(employe, date_reference_str)
            
            # Générer l'analyse détaillée de ponctualité
            ponctualite_analysis = self._generate_detailed_ponctualite_analysis(stats)
            
            return Response(ponctualite_analysis)
            
        except Employe.DoesNotExist:
            return Response(
                {"error": "Employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur analyse ponctualité: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_detailed_ponctualite_analysis(self, stats):
        """Génère une analyse détaillée de ponctualité"""
        
        ponctualite_parfaite = stats.get('ponctualite_parfaite', 0)
        ponctualite_acceptable = stats.get('ponctualite_acceptable', 0)
        ponctualite_inacceptable = stats.get('ponctualite_inacceptable', 0)
        jours_travailles = stats.get('jours_travailles', 0)
        retard_moyen = stats.get('retard_moyen_minutes', 0)
        depart_avance_moyen = stats.get('depart_avance_moyen_minutes', 0)
        regularite_statut = stats.get('regularite_statut', 'acceptable')
        
        total_jours = ponctualite_parfaite + ponctualite_acceptable + ponctualite_inacceptable
        
        if total_jours > 0:
            taux_parfait = (ponctualite_parfaite / total_jours) * 100
            taux_acceptable = (ponctualite_acceptable / total_jours) * 100
            taux_inacceptable = (ponctualite_inacceptable / total_jours) * 100
        else:
            taux_parfait = taux_acceptable = taux_inacceptable = 0
        
        return {
            'ponctualite_parfaite': ponctualite_parfaite,
            'ponctualite_acceptable': ponctualite_acceptable,
            'ponctualite_inacceptable': ponctualite_inacceptable,
            'total_jours_analyses': total_jours,
            'taux_parfait': round(taux_parfait, 1),
            'taux_acceptable': round(taux_acceptable, 1),
            'taux_inacceptable': round(taux_inacceptable, 1),
            'retard_moyen_minutes': round(retard_moyen, 1),
            'depart_avance_moyen_minutes': round(depart_avance_moyen, 1),
            'regularite_statut': regularite_statut,
            'analyse_textuelle': self._get_ponctualite_analysis_text(taux_parfait, taux_inacceptable, regularite_statut)
        }
    
    def _get_ponctualite_analysis_text(self, taux_parfait, taux_inacceptable, regularite_statut):
        """Retourne une analyse textuelle basée sur la ponctualité"""
        if taux_parfait >= 80:
            return "Excellente ponctualité, respect systématique des horaires (8h00-16h00)."
        elif taux_inacceptable <= 10:
            return "Bonne ponctualité, horaires généralement respectés avec quelques écarts mineurs."
        elif taux_inacceptable <= 30:
            return "Ponctualité acceptable, retards occasionnels mais dans les limites."
        elif regularite_statut == 'acceptable':
            return "Ponctualité à surveiller, plusieurs retards constatés."
        else:
            return "Ponctualité problématique, fréquents retards et départs anticipés."

class EmployeeHeuresComparisonAPIView(APIView):
    """Comparaison des heures travaillées sur plusieurs mois"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, cin=None):
        try:
            if not cin:
                cin = request.GET.get('cin')
                if not cin:
                    return Response(
                        {"error": "CIN requis"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            employe = Employe.objects.get(cin=cin)
            
            # Vérifier que l'utilisateur a accès
            if not (request.user.is_superuser or employe.created_by == request.user):
                return Response(
                    {"error": "Vous n'avez pas accès aux données de cet employé."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            periode_type = request.GET.get('periode', 'mois')
            date_reference_str = request.GET.get('date')
            
            # Générer les comparaisons sur les 3 derniers mois
            comparison_data = self._generate_comparison_data(employe, date_reference_str)
            
            return Response(comparison_data)
            
        except Employe.DoesNotExist:
            return Response(
                {"error": "Employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur comparaison heures: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_comparison_data(self, employe, date_reference_str):
        """Génère des données de comparaison pour les 3 derniers mois"""
        
        if date_reference_str:
            try:
                current_date = datetime.strptime(date_reference_str + '-01', '%Y-%m-%d').date()
            except ValueError:
                current_date = timezone.now().date().replace(day=1)
        else:
            current_date = timezone.now().date().replace(day=1)
        
        mois_comparaison = []
        
        # Analyser les 3 derniers mois
        for i in range(3):
            mois_date = current_date - timedelta(days=30*i)
            mois_date = mois_date.replace(day=1)
            
            try:
                # Calculer les stats pour ce mois
                stats = StatisticsService.calculate_employee_monthly_stats(employe, mois_date)
                
                # Récupérer les métriques de ponctualité
                ponctualite_parfaite = stats.get('ponctualite_parfaite', 0)
                ponctualite_acceptable = stats.get('ponctualite_acceptable', 0)
                ponctualite_inacceptable = stats.get('ponctualite_inacceptable', 0)
                regularite_statut = stats.get('regularite_statut', 'acceptable')
                
                total_jours = ponctualite_parfaite + ponctualite_acceptable + ponctualite_inacceptable
                taux_parfait = (ponctualite_parfaite / total_jours * 100) if total_jours > 0 else 0
                
                mois_comparaison.append({
                    'mois': mois_date.strftime('%b %Y'),
                    'date_reference': mois_date.strftime('%Y-%m'),
                    'heures_travaillees': str(stats.get('heures_travail_total', timedelta())),
                    'jours_travailles': stats.get('jours_travailles', 0),
                    'jours_absents': stats.get('jours_absents', 0),
                    'ponctualite_parfaite': ponctualite_parfaite,
                    'ponctualite_acceptable': ponctualite_acceptable,
                    'ponctualite_inacceptable': ponctualite_inacceptable,
                    'regularite_statut': regularite_statut,
                    'taux_parfait': round(taux_parfait, 1),
                    'taux_absence': stats.get('taux_absence', 0)
                })
                
            except Exception as e:
                logger.warning(f"Erreur calcul mois {mois_date}: {str(e)}")
                continue
        
        return {
            'employe': employe.cin,
            'nom_complet': f"{employe.nom} {employe.prenom}",
            'type_employe': 'Stagiaire' if employe.titre == 'stagiaire' else 'Employé fixe',
            'mois_precedents': mois_comparaison,
            'periode_analysée': current_date.strftime('%Y-%m')
        }

class EmployeeMonthlyTrendsAPIView(APIView):
    """Tendances mensuelles des performances"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, cin=None):
        try:
            if not cin:
                cin = request.GET.get('cin')
                if not cin:
                    return Response(
                        {"error": "CIN requis"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            employe = Employe.objects.get(cin=cin)
            
            # Vérifier que l'utilisateur a accès
            if not (request.user.is_superuser or employe.created_by == request.user):
                return Response(
                    {"error": "Vous n'avez pas accès aux tendances de cet employé."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Générer des tendances basées sur les données existantes
            trends_data = self._generate_trends_data(employe)
            
            return Response(trends_data)
            
        except Employe.DoesNotExist:
            return Response(
                {"error": "Employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur tendances mensuelles: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_trends_data(self, employe):
        """Génère des données de tendances"""
        
        # Pour l'instant, retourner des données de démonstration
        # Dans un vrai système, vous analyseriez l'historique des pointages
        return {
            'employe': employe.cin,
            'nom_complet': f"{employe.nom} {employe.prenom}",
            'type_employe': 'Stagiaire' if employe.titre == 'stagiaire' else 'Employé fixe',
            'tendances': {
                'regularite': 'stable',
                'ponctualite': 'en_amelioration',
                'productivite': 'stable',
                'presence': 'constante'
            },
            'predictions': {
                'prochain_mois': {
                    'heures_estimees': '160h',
                    'taux_regularite_estime': '85%',
                    'recommandation': 'Maintenir le rythme actuel'
                }
            },
            'alertes': []
        }

class ExportStatisticsPDFAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def _normaliser_nom_fichier(self, nom):
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
        
        for accent, sans_accent in correspondances.items():
            nom = nom.replace(accent, sans_accent)
        
        nom = re.sub(r'[^\w\s-]', '', nom)
        nom = re.sub(r'[-\s]+', '_', nom)
        
        return nom.strip('_')
    
    def _export_simple_fallback(self, request, export_type):
        """Fallback simple qui retourne un JSON au lieu d'essayer de générer un PDF"""
        return JsonResponse({
            'status': 'error',
            'message': f'Export PDF temporairement indisponible pour le type {export_type}',
            'debug': 'La génération PDF rencontre des problèmes techniques. ReportLab n\'est pas installé.',
            'solution': 'Veuillez installer ReportLab avec: pip install reportlab',
            'alternative': 'Utilisez l\'export HTML depuis l\'interface web'
        }, status=503)
    
    def get(self, request):
        export_type = request.GET.get('type', 'employe')
        
        try:
            if REPORTLAB_AVAILABLE:
                if export_type == 'employe':
                    return self._export_employee_pdf(request)
                elif export_type == 'global':
                    return self._export_global_pdf(request)
                else:
                    return Response(
                        {"error": "Type d'export non valide"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Si ReportLab n'est pas disponible, retourner immédiatement le fallback
                return self._export_simple_fallback(request, export_type)
                
        except Exception as e:
            logger.error(f"Erreur génération PDF: {str(e)}")
            return self._export_simple_fallback(request, export_type)
    
    def _export_employee_pdf(self, request):
        cin = request.GET.get('cin')
        if not cin:
            return Response(
                {"error": "CIN requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            employe = Employe.objects.get(cin=cin)
            
            # Vérifier que l'utilisateur a accès
            if not (request.user.is_superuser or employe.created_by == request.user):
                return Response(
                    {"error": "Vous n'avez pas accès au rapport de cet employé."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        except Employe.DoesNotExist:
            return Response(
                {"error": "Employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        periode_type = request.GET.get('periode', 'mois')
        date_reference_str = request.GET.get('date')
        
        try:
            if periode_type == 'semaine':
                stats = StatisticsService.calculate_employee_weekly_stats(employe, date_reference_str)
            else:
                if date_reference_str:
                    stats = StatisticsService.calculate_employee_monthly_stats(employe, date_reference_str)
                else:
                    stats = StatisticsService.calculate_employee_monthly_stats(employe)
        except Exception as e:
            logger.error(f"Erreur récupération stats employé: {str(e)}")
            return self._export_simple_fallback(request, 'employe')
        
        buffer = io.BytesIO()
        
        try:
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            # Titre principal
            titre_type = "STAGIAIRE" if employe.titre == 'stagiaire' else "EMPLOYÉ FIXE"
            title = Paragraph(f"RAPPORT DÉTAILLÉ DES STATISTIQUES - {titre_type}", styles['Title'])
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            # Informations employé
            info_style = styles['Normal']
            info_elements = [
                Paragraph(f"<b>Nom:</b> {employe.nom} {employe.prenom}", info_style),
                Paragraph(f"<b>CIN:</b> {employe.cin}", info_style),
                Paragraph(f"<b>Type:</b> {titre_type}", info_style),
            ]
            
            if employe.titre == 'employe' and employe.matricule:
                info_elements.append(Paragraph(f"<b>Matricule:</b> {employe.matricule}", info_style))
            
            # Horaires attendus
            heure_entree = employe.heure_entree_attendue or time(8, 0)
            heure_sortie = employe.heure_sortie_attendue or time(16, 0)
            marge = employe.marge_tolerance_minutes or 10
            
            info_elements.extend([
                Paragraph(f"<b>Horaires attendus:</b> {heure_entree.strftime('%H:%M')} - {heure_sortie.strftime('%H:%M')}", info_style),
                Paragraph(f"<b>Marge de tolérance:</b> {marge} minutes", info_style),
                Paragraph(f"<b>Département:</b> {employe.departement.nom if employe.departement else 'Non assigné'}", info_style),
                Paragraph(f"<b>Poste:</b> {employe.poste}", info_style),
                Paragraph(f"<b>Période analysée:</b> {stats.get('periode_debut', 'N/A')} à {stats.get('periode_fin', 'N/A')}", info_style),
                Paragraph(f"<b>Type de période:</b> {stats.get('type_periode', 'N/A')}", info_style),
            ])
            
            for element in info_elements:
                elements.append(element)
            
            elements.append(Spacer(1, 25))
            
            # Section 1: POINTAGES ET ABSENCES
            section_style = styles['Heading2']
            elements.append(Paragraph("📊 STATISTIQUES DE POINTAGE ET ABSENCES", section_style))
            elements.append(Spacer(1, 10))
            
            pointage_data = [
                ['Heures totales travaillées', self._format_duration(stats.get('heures_travail_total'))],
                ['Jours travaillés', f"{stats.get('jours_travailles', 0)} jours"],
                ['Jours d\'absence', f"{stats.get('jours_absents', 0)} jours"],
                ['Moyenne quotidienne', self._format_duration(stats.get('moyenne_heures_quotidiennes'))],
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
            
            # Section 2: PONCTUALITÉ ET RÉGULARITÉ (NOUVELLE SECTION)
            elements.append(Paragraph("🕒 ANALYSE DE PONCTUALITÉ ET RÉGULARITÉ", section_style))
            elements.append(Spacer(1, 10))
            
            ponctualite_data = [
                ['Ponctualité parfaite', f"{stats.get('ponctualite_parfaite', 0)} jours"],
                ['Ponctualité acceptable', f"{stats.get('ponctualite_acceptable', 0)} jours"],
                ['Ponctualité inacceptable', f"{stats.get('ponctualite_inacceptable', 0)} jours"],
                ['Retard moyen', f"{stats.get('retard_moyen_minutes', 0):.1f} min"],
                ['Départ moyen anticipé', f"{stats.get('depart_avance_moyen_minutes', 0):.1f} min"],
                ['Statut de régularité', f"{stats.get('regularite_statut', 'acceptable').upper()}"],
                ['Taux de régularité', f"{stats.get('taux_regularite', 0):.1f}%"],
            ]
            
            # Couleurs pour le statut de régularité
            regularite_statut = stats.get('regularite_statut', 'acceptable')
            statut_color = colors.green if regularite_statut == 'parfait' else colors.orange if regularite_statut == 'acceptable' else colors.red
            
            ponctualite_table = Table(ponctualite_data, colWidths=[80*mm, 80*mm])
            ponctualite_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF6B6B')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFF5F5')),
                ('TEXTCOLOR', (5, 5), (5, 5), statut_color),
                ('FONTNAME', (5, 5), (5, 5), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(ponctualite_table)
            elements.append(Spacer(1, 20))
            
            # Section 3: ANALYSE DES HEURES ET ABSENCES
            elements.append(Paragraph("⏰ ANALYSE DES HEURES TRAVAILLÉES ET ABSENCES", section_style))
            elements.append(Spacer(1, 10))
            
            jours_total_passes = stats.get('jours_total_passes', stats.get('jours_passes_mois', 0))
            analyse_heures_data = [
                ['Jours passés dans le mois', f"{stats.get('jours_passes_mois', 0)} jours"],
                ['Jours totaux passés', f"{jours_total_passes} jours"],
                ['Heures attendues', self._format_duration(stats.get('heures_attendues_jours_passes'))],
                ['Heures réelles', self._format_duration(stats.get('heures_travail_total'))],
                ['Écart', self._format_duration(stats.get('ecart_heures'))],
                ['Statut des heures', f"{stats.get('statut_heures', 'N/A')}"],
                ['Pourcentage d\'écart', f"{stats.get('pourcentage_ecart', 0):.1f}%"],
                ['Taux de présence', f"{stats.get('taux_presence', 0):.1f}%"],
                ['Taux d\'absence', f"{stats.get('taux_absence', 0):.1f}%"],
            ]
            
            # Déterminer la couleur du statut
            statut = stats.get('statut_heures', 'NORMAL')
            statut_color = colors.green
            if statut == 'INSUFFISANT':
                statut_color = colors.red
            elif statut == 'SURPLUS':
                statut_color = colors.blue
            
            analyse_table = Table(analyse_heures_data, colWidths=[80*mm, 80*mm])
            analyse_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A4A4A')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
                ('TEXTCOLOR', (5, 5), (5, 5), statut_color),
                ('TEXTCOLOR', (8, 8), (8, 8), colors.red if stats.get('taux_absence', 0) > 10 else colors.black),
                ('FONTNAME', (5, 5), (5, 5), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(analyse_table)
            elements.append(Spacer(1, 20))
            
            # Section 4: OBSERVATION (avec absences)
            if stats.get('observation_heures'):
                elements.append(Paragraph("📝 OBSERVATION ET RECOMMANDATIONS", section_style))
                elements.append(Spacer(1, 10))
                
                observation_style = styles['Normal']
                observation_text = Paragraph(f"<i>{stats.get('observation_heures', 'Aucune observation disponible.')}</i>", observation_style)
                elements.append(observation_text)
                elements.append(Spacer(1, 20))
            
            # Pied de page
            footer_style = styles['Italic']
            footer = Paragraph(f"Rapport généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')} - Système de Gestion RH", footer_style)
            elements.append(footer)
            
            # Construction du PDF
            doc.build(elements)
            buffer.seek(0)
            
            response = HttpResponse(buffer, content_type='application/pdf')
            
            nom_employe = f"{employe.nom}_{employe.prenom}"
            nom_employe_normalise = self._normaliser_nom_fichier(nom_employe)
            type_employe = "stagiaire" if employe.titre == 'stagiaire' else "employe"
            nom_fichier = f"rapport_statistiques_{nom_employe_normalise}_{type_employe}_{employe.cin}.pdf"
            
            response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur génération PDF ReportLab: {str(e)}")
            return self._export_simple_fallback(request, 'employe')
    
    # views.py - Fonction _export_global_pdf complète

    def _export_global_pdf(self, request):
        mois_str = request.GET.get('mois')
        
        stats = StatisticsService.calculate_global_monthly_stats(mois_str)
        
        buffer = io.BytesIO()
        
        try:
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            title = Paragraph("RAPPORT STATISTIQUES GLOBALES", styles['Title'])
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            periode_text = Paragraph(f"<b>Période:</b> {stats.get('periode', 'N/A').strftime('%B %Y') if hasattr(stats.get('periode'), 'strftime') else 'N/A'} ({stats.get('jours_passes_mois', 0)} jours analysés)", styles['Normal'])
            elements.append(periode_text)
            elements.append(Spacer(1, 25))
            
            section_style = styles['Heading2']
            elements.append(Paragraph("🌐 STATISTIQUES GLOBALES", section_style))
            elements.append(Spacer(1, 10))
            
            # Section pour les jours analysés
            jours_section = styles['Heading3']
            elements.append(Paragraph("📅 JOURS ANALYSÉS", jours_section))
            elements.append(Spacer(1, 5))
            
            # MODIFIÉ: Supprimé "Jours totaux attendus"
            jours_data = [
                ['Jours passés dans le mois', f"{stats.get('jours_passes_mois', 0)} jours"],
                ['Employés actifs', f"{stats.get('employes_actifs', 0)}"],
                ['Pointages effectués', f"{stats.get('total_pointages', 0)} jours"],
            ]
            
            jours_table = Table(jours_data, colWidths=[80*mm, 80*mm])
            jours_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0F8FF')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(jours_table)
            elements.append(Spacer(1, 15))
            
            # Section pour les absences
            absences_section = styles['Heading3']
            elements.append(Paragraph("📉 ANALYSE DES ABSENCES", absences_section))
            elements.append(Spacer(1, 5))
            
            # MODIFIÉ: Supprimé référence à jours_total_attendus
            absences_data = [
                ['Total absences', f"{stats.get('total_absences', 0)} jours"],
                ['Taux d\'absence global', f"{stats.get('taux_absence_global', 0):.1f}%"],
                ['Taux de présence global', f"{stats.get('taux_presence', 0):.1f}%"],
            ]
            
            absences_table = Table(absences_data, colWidths=[80*mm, 80*mm])
            absences_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF9999')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFF5F5')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(absences_table)
            elements.append(Spacer(1, 15))
            
            # Section pour la ponctualité et régularité
            elements.append(Paragraph("🕒 PONCTUALITÉ ET RÉGULARITÉ GLOBALE", section_style))
            elements.append(Spacer(1, 10))
            
            ponctualite_data = [
                ['Ponctualité parfaite', f"{stats.get('ponctualite_parfaite', 0)}"],
                ['Ponctualité acceptable', f"{stats.get('ponctualite_acceptable', 0)}"],
                ['Ponctualité inacceptable', f"{stats.get('ponctualite_inacceptable', 0)}"],
                ['Taux régularité parfaite', f"{stats.get('taux_regularite_parfaite', 0):.1f}%"],
                ['Taux régularité acceptable', f"{stats.get('taux_regularite_acceptable', 0):.1f}%"],
                ['Taux régularité inacceptable', f"{stats.get('taux_regularite_inacceptable', 0):.1f}%"],
            ]
            
            ponctualite_table = Table(ponctualite_data, colWidths=[80*mm, 80*mm])
            ponctualite_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6B48FF')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0F5FF')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(ponctualite_table)
            elements.append(Spacer(1, 15))
            
            # Section pour l'analyse des heures globales
            elements.append(Paragraph("⏰ ANALYSE DES HEURES GLOBALES", section_style))
            elements.append(Spacer(1, 10))
            
            statut = stats.get('statut_heures_global', 'NORMAL')
            statut_color = colors.green
            if statut == 'INSUFFISANT':
                statut_color = colors.red
            elif statut == 'SURPLUS':
                statut_color = colors.blue
            
            heures_data = [
                ['Heures attendues totales', self._format_duration(stats.get('heures_attendues_total'))],
                ['Heures travaillées totales', self._format_duration(stats.get('heures_travail_total'))],
                ['Écart global', self._format_duration(stats.get('ecart_heures_global'))],
                ['Pourcentage d\'écart', f"{stats.get('pourcentage_ecart_global', 0):.1f}%"],
                ['Statut des heures', f"{statut}"],
            ]
            
            heures_table = Table(heures_data, colWidths=[80*mm, 80*mm])
            heures_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A4A4A')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
                ('TEXTCOLOR', (4, 4), (4, 4), statut_color),
                ('FONTNAME', (4, 4), (4, 4), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(heures_table)
            elements.append(Spacer(1, 15))
            
            elements.append(Paragraph("📊 DONNÉES GÉNÉRALES", section_style))
            elements.append(Spacer(1, 10))
            
            global_data = [
                ['Total employés', f"{stats.get('total_employes', 0)}"],
                ['Employés actifs', f"{stats.get('employes_actifs', 0)}"],
                ['Total départements', f"{stats.get('total_departements', 0)}"],
                ['Départements actifs', f"{stats.get('departements_actifs', 0)}"],
                ['Taux d\'activité global', f"{stats.get('taux_activite_global', 0):.1f}%"],
                ['Moyenne quotidienne', self._format_duration(stats.get('moyenne_heures_quotidiennes'))],
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
            
            # Ajouter l'observation globale si disponible
            if stats.get('observation_globale'):
                elements.append(Spacer(1, 20))
                elements.append(Paragraph("📝 OBSERVATION GLOBALE", section_style))
                elements.append(Spacer(1, 10))
                
                observation_style = styles['Normal']
                observation_text = Paragraph(f"<i>{stats.get('observation_globale', '')}</i>", observation_style)
                elements.append(observation_text)
        
            elements.append(Spacer(1, 25))
            footer = Paragraph(f"Rapport généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')} - Système de Gestion RH", styles['Italic'])
            elements.append(footer)
            
            doc.build(elements)
            buffer.seek(0)
            
            response = HttpResponse(buffer, content_type='application/pdf')
            
            nom_fichier = f"statistiques_globales_{timezone.now().strftime('%Y%m%d')}.pdf"
            
            response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur génération PDF global: {str(e)}")
            return self._export_simple_fallback(request, 'global')

    
    def _format_duration(self, duration):
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

# AJOUT DES VUES D'AUTHENTIFICATION JWT
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

class CustomTokenObtainPairView(TokenObtainPairView):
    pass

class CustomTokenRefreshView(TokenRefreshView):
    pass

class CustomTokenVerifyView(TokenVerifyView):
    pass