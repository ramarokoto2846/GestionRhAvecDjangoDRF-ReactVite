from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    RegisterViewSet, DepartementViewSet, EmployeViewSet,
    PointageViewSet, AbsenceViewSet, CongeViewSet, EvenementViewSet, CurrentUserView,
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
    # ✅ INCLURE LE ROUTER APRÈS
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', CurrentUserView.as_view(), name='current-user'),

    path('api/statistiques/employe/', views.EmployeeStatisticsAPIView.as_view(), name='employee_stats'),
    path('api/statistiques/employe/<str:matricule>/', views.EmployeeStatisticsAPIView.as_view(), name='employee_stats_detail'),
    path('api/statistiques/global/', views.GlobalStatisticsAPIView.as_view(), name='global_stats'),
    path('api/statistiques/export-pdf/', views.ExportStatisticsPDFAPIView.as_view(), name='export_stats_pdf'),
]