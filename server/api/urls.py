from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    RegisterViewSet, DepartementViewSet, EmployeViewSet,
    PointageViewSet, CurrentUserView,
    EmployeePonctualiteAnalysisAPIView,
    EmployeeHeuresComparisonAPIView, 
    EmployeeMonthlyTrendsAPIView,
    EmployeeStatisticsAPIView,
    GlobalStatisticsAPIView,
    ExportStatisticsPDFAPIView,
    StatistiquesEmployeViewSet,
    StatistiquesGlobalesViewSet
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('departements', DepartementViewSet)
router.register('employes', EmployeViewSet)
router.register('pointages', PointageViewSet)
# ✅ AJOUTER les statistiques sauvegardées
router.register('statistiques-employe', StatistiquesEmployeViewSet, basename='statistiques-employe')
router.register('statistiques-globales', StatistiquesGlobalesViewSet, basename='statistiques-globales')

urlpatterns = [   
    # ✅ INCLURE LE ROUTER APRÈS avec préfixe /api/
    path('api/', include(router.urls)),
    
    # Authentification JWT - avec préfixe /api/
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', CurrentUserView.as_view(), name='current-user'),

    # ✅ CORRECTION : Utiliser 'cin' au lieu de 'matricule' - avec préfixe /api/
    path('api/statistiques/employe/', EmployeeStatisticsAPIView.as_view(), name='employee_stats'),
    path('api/statistiques/employe/<str:cin>/', EmployeeStatisticsAPIView.as_view(), name='employee_stats_detail'),
    
    # Statistiques globales - avec préfixe /api/
    path('api/statistiques/global/', GlobalStatisticsAPIView.as_view(), name='global_stats'),
    
    # Export PDF - avec préfixe /api/
    path('api/statistiques/export-pdf/', ExportStatisticsPDFAPIView.as_view(), name='export_stats_pdf'),

    # ✅ CORRECTION : URLs pour les analyses avancées - avec préfixe /api/
    path('api/statistiques/ponctualite/', EmployeePonctualiteAnalysisAPIView.as_view(), name='employee-ponctualite'),
    path('api/statistiques/ponctualite/<str:cin>/', EmployeePonctualiteAnalysisAPIView.as_view(), name='employee-ponctualite-detail'),
    
    path('api/statistiques/comparaison-heures/', EmployeeHeuresComparisonAPIView.as_view(), name='employee-comparaison-heures'),
    path('api/statistiques/comparaison-heures/<str:cin>/', EmployeeHeuresComparisonAPIView.as_view(), name='employee-comparaison-heures-detail'),
    
    path('api/statistiques/tendances/', EmployeeMonthlyTrendsAPIView.as_view(), name='employee-tendances'),
    path('api/statistiques/tendances/<str:cin>/', EmployeeMonthlyTrendsAPIView.as_view(), name='employee-tendances-detail'),
]