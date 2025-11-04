from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    RegisterViewSet, DepartementViewSet, EmployeViewSet,
    PointageViewSet, EvenementViewSet, CurrentUserView,
    EmployeePonctualiteAnalysisAPIView,
    EmployeeHeuresComparisonAPIView, 
    EmployeeMonthlyTrendsAPIView,
    EmployeeStatisticsAPIView,
    GlobalStatisticsAPIView,
    ExportStatisticsPDFAPIView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('departements', DepartementViewSet)
router.register('employes', EmployeViewSet)
router.register('pointages', PointageViewSet)
router.register('evenements', EvenementViewSet)

urlpatterns = [   
    # ✅ INCLURE LE ROUTER APRÈS
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', CurrentUserView.as_view(), name='current-user'),

    # Statistiques existantes
    path('api/statistiques/employe/', EmployeeStatisticsAPIView.as_view(), name='employee_stats'),
    path('api/statistiques/employe/<str:matricule>/', EmployeeStatisticsAPIView.as_view(), name='employee_stats_detail'),
    path('api/statistiques/global/', GlobalStatisticsAPIView.as_view(), name='global_stats'),
    path('api/statistiques/export-pdf/', ExportStatisticsPDFAPIView.as_view(), name='export_stats_pdf'),

    # ✅ CORRECTION : Ajouter 'api/' devant les nouvelles URLs
    path('api/statistiques/ponctualite/<str:matricule>/', EmployeePonctualiteAnalysisAPIView.as_view(), name='employee-ponctualite'),
    path('api/statistiques/comparaison-heures/<str:matricule>/', EmployeeHeuresComparisonAPIView.as_view(), name='employee-comparaison-heures'),
    path('api/statistiques/tendances/<str:matricule>/', EmployeeMonthlyTrendsAPIView.as_view(), name='employee-tendances'),
]