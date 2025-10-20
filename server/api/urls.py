# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    RegisterViewSet, DepartementViewSet, EmployeViewSet, ExportPDFAPIView,
    PointageViewSet, AbsenceViewSet, CongeViewSet, EvenementViewSet, CurrentUserView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('departements', DepartementViewSet)
router.register('employes', EmployeViewSet)
router.register('pointages', PointageViewSet)
router.register('absences', AbsenceViewSet)
router.register('conges', CongeViewSet)
router.register('evenements', EvenementViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', CurrentUserView.as_view(), name='current-user'),

    path('api/statistiques/employe/', views.EmployeeStatisticsAPIView.as_view(), name='employee_stats'),
    path('api/statistiques/employe/<str:matricule>/', views.EmployeeStatisticsAPIView.as_view(), name='employee_stats_detail'),
    path('api/statistiques/departement/', views.DepartmentStatisticsAPIView.as_view(), name='department_stats'),
    path('api/statistiques/departement/<str:departement_id>/', views.DepartmentStatisticsAPIView.as_view(), name='department_stats_detail'),
    path('api/statistiques/global/', views.GlobalStatisticsAPIView.as_view(), name='global_stats'),
    path('api/statistiques/detaillees/', views.DetailedStatisticsAPIView.as_view(), name='detailed_stats'),
    path('api/statistiques/export-pdf/', views.ExportStatisticsPDFAPIView.as_view(), name='export_stats_pdf'),


    # ✅ AJOUTER CETTE LIGNE POUR L'EXPORT PDF DES TABLES
    path('api/export/pdf/', ExportPDFAPIView.as_view(), name='export-pdf'),

    path('api/statistiques/employe/', views.EmployeeStatisticsAPIView.as_view(), name='employee_stats'),
    path('api/statistiques/employe/<str:matricule>/', views.EmployeeStatisticsAPIView.as_view(), name='employee_stats_detail'),
    path('api/statistiques/departement/', views.DepartmentStatisticsAPIView.as_view(), name='department_stats'),
    path('api/statistiques/departement/<str:departement_id>/', views.DepartmentStatisticsAPIView.as_view(), name='department_stats_detail'),
    path('api/statistiques/global/', views.GlobalStatisticsAPIView.as_view(), name='global_stats'),
    path('api/statistiques/detaillees/', views.DetailedStatisticsAPIView.as_view(), name='detailed_stats'),
    path('api/statistiques/export-pdf/', views.ExportStatisticsPDFAPIView.as_view(), name='export_stats_pdf'),
]